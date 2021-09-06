// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./EthereumLightClient.sol";
import "./lib/RLPReader.sol";
import {EthereumProver} from "./EthereumProver.sol";
import {IERC20} from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import {Ownable} from "openzeppelin-solidity/contracts/access/Ownable.sol";
import {BridgedToken} from "./BridgedToken.sol";

contract HarmonyBridge is Ownable {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event TokenMapReq(
        address indexed tokenReq,
        uint8 indexed decimals,
        string name,
        string symbol
    );

    event TokenMapAck(address indexed tokenReq, address indexed tokenAck);

    event Locked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        address recipient
    );

    event Burn(
        address indexed token,
        address indexed sender,
        uint256 amount,
        address recipient
    );

    bytes32 constant TokenMapReqEventSig =
        keccak256("TokenMapReq(address,uint8,string,string)");
    bytes32 constant TokenMapAckEventSig =
        keccak256("TokenMapAck(address,address)");
    bytes32 constant lockEventSig =
        keccak256("Locked(address,address,uint256,address)");
    bytes32 constant burnEventSig =
        keccak256("Burn(address,address,uint256,address)");

    EthereumLightClient public lightclient;

    address public otherSideBridge;

    IERC20[] public TxTokens; // thisSide locked ERC20 list
    BridgedToken[] public RxTokens; // bridged token list, keys of

    // TX means token issued in this chain, and cross to another chain
    mapping(address => address) public TxMapped; // thisSide locked => otherSide mint
    mapping(address => IERC20) public TxMappedInv; // inverse KV

    // RX means token issued in another chain, and cross to this chain.
    mapping(address => BridgedToken) public RxMapped; // otherSide locked => thisSide mint
    mapping(address => address) public RxMappedInv; // inverse KV

    mapping(bytes32 => bool) public spentReceipt;

    function totalBridgedTokens() external view returns (uint256, uint256) {
        return (TxTokens.length, RxTokens.length);
    }

    function changeLightClient(EthereumLightClient newClient)
        external
        onlyOwner
    {
        lightclient = newClient;
    }

    function bind(address otherSide) external onlyOwner {
        otherSideBridge = otherSide;
    }

    function issueTokenMapReq(ERC20 thisSideToken) external returns (address) {
        require(
            TxMapped[address(thisSideToken)] == address(0),
            "token is already mapped"
        );
        ERC20 tokenDetail = thisSideToken;
        emit TokenMapReq(
            address(thisSideToken),
            tokenDetail.decimals(),
            tokenDetail.name(),
            tokenDetail.symbol()
        );
    }

    function withdraw(
        BridgedToken token,
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "recipient is a zero address");
        require(
            RxMappedInv[address(token)] != address(0),
            "bridge does not exist"
        );
        token.burnFrom(msg.sender, amount);
        emit Burn(address(token), msg.sender, amount, recipient);
    }

    function deposit(
        IERC20 token,
        address recipient,
        uint256 amount
    ) external {
        require(recipient != address(0), "recipient is a zero address");
        require(
            TxMapped[address(token)] != address(0),
            "bridge does not exist"
        );
        // grabbing the actual amount that is transferred
        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 balanceAfter = token.balanceOf(address(this));
        uint256 actualAmount = balanceAfter.sub(balanceBefore);
        emit Locked(address(token), msg.sender, actualAmount, recipient);
    }

    function validateAndExecuteProof(
        uint256 blockNo,
        bytes32 rootHash,
        bytes calldata mptkey,
        bytes calldata proof
    ) external {
        bytes32 blockHash = bytes32(lightclient.blocksByHeight(blockNo, 0));
        require(
            lightclient.VerifyReceiptsHash(blockHash, rootHash),
            "wrong receipt hash"
        );
        bytes32 receiptHash = keccak256(
            abi.encodePacked(blockHash, rootHash, mptkey)
        );
        require(spentReceipt[receiptHash] == false, "double spent!");
        bytes memory rlpdata = EthereumProver.validateMPTProof(rootHash, mptkey, proof);
        spentReceipt[receiptHash] = true;
        uint256 executedEvents = execute(rlpdata);
        require(executedEvents > 0, "no valid event");
    }

    function execute(bytes memory rlpdata) private returns (uint256 events) {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        RLPReader.RLPItem[] memory receipt = stacks.toList();
        // TODO: check txs is revert or not
        uint256 postStateOrStatus = receipt[0].toUint();
        require(postStateOrStatus == 1, "revert receipt");
        //uint CumulativeGasUsed = receipt[1].toUint();
        //bytes memory Bloom = receipt[2].toBytes();
        RLPReader.RLPItem[] memory logs = receipt[3].toList();
        for (uint256 i = 0; i < logs.length; i++) {
            RLPReader.RLPItem[] memory rlpLog = logs[i].toList();
            address Address = rlpLog[0].toAddress();
            if (Address != otherSideBridge) continue;
            RLPReader.RLPItem[] memory Topics = rlpLog[1].toList(); // TODO: if is lock event
            bytes32[] memory topics = new bytes32[](Topics.length);
            for (uint256 j = 0; j < Topics.length; j++) {
                topics[j] = bytes32(Topics[j].toUint());
            }
            bytes memory Data = rlpLog[2].toBytes();
            if (topics[0] == lockEventSig) {
                onLockEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == burnEventSig) {
                onBurnEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == TokenMapReqEventSig) {
                onTokenMapReqEvent(topics, Data);
                events++;
                continue;
            }
            if (topics[0] == TokenMapAckEventSig) {
                onTokenMapAckEvent(topics);
                events++;
                continue;
            }
        }
    }

    function onBurnEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(
            data,
            (uint256, address)
        );
        IERC20 lockedToken = TxMappedInv[token];
        lockedToken.safeTransfer(recipient, amount);
    }

    function onLockEvent(bytes32[] memory topics, bytes memory data) private {
        address token = address(uint160(uint256(topics[1])));
        //address sender = address(uint160(uint256(topics[2])));
        (uint256 amount, address recipient) = abi.decode(
            data,
            (uint256, address)
        );
        BridgedToken mintToken = RxMapped[token];
        require(address(mintToken) != address(0));
        mintToken.mint(recipient, amount);
    }

    function onTokenMapReqEvent(bytes32[] memory topics, bytes memory data)
        private
    {
        // event TokenMapReq(address indexed tokenReq, uint256 decimals, string name, string symbol);
        address tokenReq = address(uint160(uint256(topics[1])));
        require(
            address(RxMapped[tokenReq]) == address(0),
            "bridge already exist"
        );
        uint8 decimals = uint8(uint256(topics[2]));
        (string memory name, string memory symbol) = abi.decode(
            data,
            (string, string)
        );
        bytes32 salt = bytes32(uint256(uint160(tokenReq)));
        BridgedToken mintAddress = new BridgedToken{salt: salt}(
            name,
            symbol,
            decimals
        );
        RxMappedInv[address(mintAddress)] = tokenReq;
        RxMapped[tokenReq] = mintAddress;
        RxTokens.push(mintAddress);
        emit TokenMapAck(tokenReq, address(mintAddress));
    }

    function onTokenMapAckEvent(bytes32[] memory topics) private {
        address tokenReq = address(uint160(uint256(topics[1])));
        address tokenAck = address(uint160(uint256(topics[2])));
        require(
            TxMapped[tokenReq] == address(0),
            "missing mapping to acknowledge"
        );
        TxMapped[tokenReq] = tokenAck;
        TxMappedInv[tokenAck] = IERC20(tokenReq);
        TxTokens.push(IERC20(tokenReq));
    }
}
