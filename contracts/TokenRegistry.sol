// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
// import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "./BridgedToken.sol";

contract TokenRegistry {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    event TokenMapReq(
        address indexed tokenReq,
        uint8 indexed decimals,
        string name,
        string symbol
    );

    event TokenMapAck(address indexed tokenReq, address indexed tokenAck);

    bytes32 constant TokenMapReqEventSig =
        keccak256("TokenMapReq(address,uint8,string,string)");
    bytes32 constant TokenMapAckEventSig =
        keccak256("TokenMapAck(address,address)");

    IERC20Upgradeable[] public TxTokens; // thisSide locked ERC20 list
    BridgedToken[] public RxTokens; // bridged token list, keys of

    // TX means token issued in this chain, and cross to another chain
    mapping(address => address) public TxMapped; // thisSide locked => otherSide mint
    mapping(address => IERC20Upgradeable) public TxMappedInv; // inverse KV

    // RX means token issued in another chain, and cross to this chain.
    mapping(address => BridgedToken) public RxMapped; // otherSide locked => thisSide mint
    mapping(address => address) public RxMappedInv; // inverse KV

    function totalBridgedTokens() external view returns (uint256, uint256) {
        return (TxTokens.length, RxTokens.length);
    }

    function issueTokenMapReq(ERC20Upgradeable thisSideToken) external returns (address) {
        require(
            TxMapped[address(thisSideToken)] == address(0),
            "token is already mapped"
        );
        ERC20Upgradeable tokenDetail = thisSideToken;
        emit TokenMapReq(
            address(thisSideToken),
            tokenDetail.decimals(),
            tokenDetail.name(),
            tokenDetail.symbol()
        );
    }

    function onTokenMapReqEvent(bytes32[] memory topics, bytes memory data)
        public
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
        BridgedToken mintAddress = new BridgedToken{salt: salt}();
        mintAddress.initialize(
            name,
            symbol,
            decimals
        );
        RxMappedInv[address(mintAddress)] = tokenReq;
        RxMapped[tokenReq] = mintAddress;
        RxTokens.push(mintAddress);
        emit TokenMapAck(tokenReq, address(mintAddress));
    }

    function onTokenMapAckEvent(bytes32[] memory topics) public {
        address tokenReq = address(uint160(uint256(topics[1])));
        address tokenAck = address(uint160(uint256(topics[2])));
        require(
            TxMapped[tokenReq] == address(0),
            "missing mapping to acknowledge"
        );
        TxMapped[tokenReq] = tokenAck;
        TxMappedInv[tokenAck] = IERC20Upgradeable(tokenReq);
        TxTokens.push(IERC20Upgradeable(tokenReq));
    }
}
