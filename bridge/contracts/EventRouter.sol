pragma solidity ^0.6.2;

import {Ownable} from "openzeppelin-solidity/contracts/access/Ownable.sol";

import {ILightClient} from "./LightClient.sol";
import {Observer, PubSub} from "./IPubSub.sol";
import {ProvethVerifier, RLPReader} from "./MPTSolidity/ProvethVerifier.sol";

contract EventRouter is PubSub,ProvethVerifier,Ownable {
    using RLPReader for RLPReader.RLPItem;
	using RLPReader for bytes;

    ILightClient public lightclient;

    mapping(bytes32=>bool) public spentReceipt;

    mapping(address=>Observer) public Subscription;

    constructor(ILightClient client) Ownable() public {
        lightclient = client;
    }

    function changeLightClient(ILightClient newClient) public onlyOwner {
        lightclient = newClient;
    }

    function Subscribe(address from, Observer ob) public override onlyOwner {
        Subscription[from] = ob;
    }

    function Publish(address publisher, bytes32[] memory topics, bytes memory data) internal override {
        Observer ob = Subscription[publisher];
        if(ob != Observer(0))
            ob.onEvent(publisher, topics, data); // .call{gas}(abi.)
        // abi.encodeWithSignature(string memory signature, ...) returns (bytes memory)
        // abi.encodeWithSelector(bytes4(keccak256(bytes(signature)), ...)`
        // https://docs.soliditylang.org/en/v0.5.3/miscellaneous.html?highlight=selector#global-variables
    }

    function ExecProof(bytes32 blockHash, bytes32 rootHash, bytes memory mptkey, bytes memory proof) public {
        require(lightclient.VerifyReceiptsHash(blockHash, rootHash), "wrong receipt hash");
        bytes32 receiptHash = keccak256(abi.encodePacked(blockHash, rootHash, mptkey));
        require(spentReceipt[receiptHash] == false, "double spent!");
        bytes memory rlpdata = MPTProof(rootHash, mptkey, proof); // double spending check
        spentReceipt[receiptHash] = true;
        receiptVerify(rlpdata);
    }

	function receiptVerify(bytes memory rlpdata) private {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        RLPReader.RLPItem[] memory receipt = stacks.toList();
        // TODO: check txs is revert or not
        uint PostStateOrStatus = receipt[0].toUint();
        require(PostStateOrStatus == 1, "revert receipt");
        //uint CumulativeGasUsed = receipt[1].toUint();
        //bytes memory Bloom = receipt[2].toBytes();
        RLPReader.RLPItem[] memory Logs = receipt[3].toList();
        for(uint i = 0; i < Logs.length; i++) {
            RLPReader.RLPItem[] memory rlpLog = Logs[i].toList();
            address Address = rlpLog[0].toAddress();
            RLPReader.RLPItem[] memory Topics = rlpLog[1].toList(); // TODO: if is lock event
            bytes32[] memory topics = new bytes32[](Topics.length);
            for(uint j = 0; j < Topics.length; j++) {
                topics[j] = bytes32(Topics[j].toUint());
            }
            bytes memory Data = rlpLog[2].toBytes();
            Publish(Address, topics, Data);
        }
	}
}
