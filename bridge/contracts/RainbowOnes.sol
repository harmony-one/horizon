pragma solidity ^0.6.2;

import { ILightClient } from "./LightClient.sol";
import { EVerifier, RLPReader } from "../../everifier/contracts/EVerifier.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ERC20 } from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import { SafeERC20 } from "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import { Ownable } from "openzeppelin-solidity/contracts/access/Ownable.sol";
import { BridgedToken } from "./BridgedToken.sol";

contract RainbowOnes is Ownable {
    using RLPReader for RLPReader.RLPItem;
	using RLPReader for bytes;
    using SafeERC20 for IERC20;

    event TokenMapReq(address indexed tokenReq, uint8 indexed decimals, string name, string symbol);
    bytes32 constant TokenMapReqEventSig = keccak256("TokenMapReq(address,uint8,string,string)");
    event TokenMapAck(address indexed tokenReq, address indexed tokenAck);
    bytes32 constant TokenMapAckEventSig = keccak256("TokenMapAck(address,address)");
    event Locked(address indexed token, address indexed sender, uint256 amount, address recipient);
    bytes32 constant lockEventSig = keccak256("Locked(address,address,uint256,address)");
    event Burn(address indexed token, address indexed sender, uint256 amount, address recipient);
    bytes32 constant burnEventSig = keccak256("Burn(address,address,uint256,address)");

    address public otherSideBridge;
    ILightClient public lightclient;

    IERC20[] public TxTokens; // thisSide locked ERC20 list
    BridgedToken[] public RxTokens; // bridged token list, keys of 

    // TX means token issued in this chain, and cross to another chain
    mapping(address=>address) public TxMapped;   // thisSide locked => otherSide mint
    mapping(address=>IERC20) public TxMappedInv;    // inverse KV

    // RX means token issued in another chain, and cross to this chain.
    mapping(address=>BridgedToken) public RxMapped;  // otherSide locked => thisSide mint
    mapping(address=>address) public RxMappedInv;     // inverse KV

    mapping(bytes32=>bool) public spentReceipt;

    function getRainbowSize() view external returns(uint256, uint256) {
        return (TxTokens.length, RxTokens.length);
    }

    function changeLightClient(ILightClient newClient) external onlyOwner {
        lightclient = newClient;
    }

    function Bind(address otherSide) external onlyOwner {
        otherSideBridge = otherSide;
    }

    function RainbowMap(ERC20 thisSideToken) external returns(address) {
        require(TxMapped[address(thisSideToken)] == address(0), "rainbow is exists");
        ERC20 tokenDetail = thisSideToken;
        emit TokenMapReq(address(thisSideToken), tokenDetail.decimals(), tokenDetail.name(), tokenDetail.symbol());
    }

    function RainbowBack(BridgedToken token, address recipient, uint256 amount) external {
        require(
            recipient != address(0),
            "Locker/recipient is a zero address"
        );
        require(RxMappedInv[address(token)] != address(0), "bridge isn't exist");
        token.burnFrom(msg.sender, amount);
        emit Burn(address(token), msg.sender, amount, recipient);
    }

    function RainbowTo(IERC20 token, address recipient, uint256 amount) external {
        require(
            recipient != address(0),
            "Locker/recipient is a zero address"
        );
        require(TxMapped[address(token)] != address(0), "bridge isn't exist");
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Locked(address(token), msg.sender, amount, recipient);
    }

    function ExecProof(uint256 blockNo, bytes32 rootHash, bytes calldata mptkey, bytes calldata proof) external {
        bytes32 blockHash = bytes32(lightclient.blocksByHeight(blockNo, 0));
        require(lightclient.VerifyReceiptsHash(blockHash, rootHash), "wrong receipt hash");
        bytes32 receiptHash = keccak256(abi.encodePacked(blockHash, rootHash, mptkey));
        require(spentReceipt[receiptHash] == false, "double spent!");
        bytes memory rlpdata = EVerifier.MPTProof(rootHash, mptkey, proof); // double spending check
        spentReceipt[receiptHash] = true;
        uint256 events = receiptVerify(rlpdata);
        require(events > 0, "no valid event");
    }

	function receiptVerify(bytes memory rlpdata) private returns(uint256 events) {
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
            if(Address != otherSideBridge) continue;
            RLPReader.RLPItem[] memory Topics = rlpLog[1].toList(); // TODO: if is lock event
            bytes32[] memory topics = new bytes32[](Topics.length);
            for(uint j = 0; j < Topics.length; j++) {
                topics[j] = bytes32(Topics[j].toUint());
            }
            bytes memory Data = rlpLog[2].toBytes();
            if(topics[0] == lockEventSig){
                onLockEvent(topics, Data);
                events++;
                continue;
            }
            if(topics[0] == burnEventSig){
                onBurnEvent(topics, Data);
                events++;
                continue;
            }
            if(topics[0] == TokenMapReqEventSig){
                onTokenMapReqEvent(topics, Data);
                events++;
                continue;
            }
            if(topics[0] == TokenMapAckEventSig){
                onTokenMapAckEvent(topics, Data);
                events++;
                continue;
            }
        }
	}

    function onBurnEvent(bytes32[] memory topics, bytes memory Data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(Data, (uint256, address));
        IERC20 lockedToken = TxMappedInv[token];
        lockedToken.safeTransfer(recipient, amount);
    }

    function onLockEvent(bytes32[] memory topics, bytes memory Data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(Data, (uint256, address));
        BridgedToken mintToken = RxMapped[token];
        require(address(mintToken) != address(0));
        mintToken.mint(recipient, amount);
    }

    function onTokenMapReqEvent(bytes32[] memory topics, bytes memory Data) private {
        // event TokenMapReq(address indexed tokenReq, uint256 decimals, string name, string symbol);
        address tokenReq = address(uint160(uint256(topics[1])));
        require(address(RxMapped[tokenReq]) == address(0), "bridge already exist");
        uint8 decimals = uint8(uint256(topics[2]));
        (string memory name, string memory symbol) = abi.decode(Data, (string, string));
        bytes32 salt = bytes32(uint256(uint160(tokenReq)));
        BridgedToken mintAddress = new BridgedToken{salt: salt}(name, symbol, decimals);
        RxMappedInv[address(mintAddress)] = tokenReq;
        RxMapped[tokenReq] = mintAddress;
        RxTokens.push(mintAddress);
        emit TokenMapAck(tokenReq, address(mintAddress));
    }

    function onTokenMapAckEvent(bytes32[] memory topics, bytes memory Data) private {
        // event TokenMapAck(address indexed tokenReq, address indexed tokenAck);
        Data;
        address tokenReq = address(uint160(uint256(topics[1])));
        address tokenAck = address(uint160(uint256(topics[2])));
        require(TxMapped[tokenReq] == address(0), "impossible ack"); // just check, shouldn't happen
        TxMapped[tokenReq] = tokenAck;
        TxMappedInv[tokenAck] = IERC20(tokenReq);
        TxTokens.push(IERC20(tokenReq));
    }
}
