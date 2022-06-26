// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "./BridgeERC1155.sol";

contract ERC1155Registry {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    event ERC1155MapReq(
        address indexed tokenReq
    );

    event ERC1155MapAck(
        address indexed tokenReq,
        address indexed tokenAck
    );

    bytes32 constant ERC1155MapReqEventSig =
        keccak256("ERC1155MapReq(address)");
    bytes32 constant ERC1155MapAckEventSig =
        keccak256("ERC1155MapAck(address,address)");

    IERC1155Upgradeable[] public Tx1155Tokens; // thisSide locked ERC1155 list
    BridgeERC1155[] public Rx1155Tokens; // bridged token list, keys of

    // TX means token issued in this chain, and cross to another chain
    mapping(address => address) public Tx1155Mapped; // thisSide locked => otherSide mint
    mapping(address => IERC1155Upgradeable) public Tx1155MappedInv; // inverse KV

    // RX means token issued in another chain, and cross to this chain.
    mapping(address => BridgeERC1155) public Rx1155Mapped; // otherSide locked => thisSide mint
    mapping(address => address) public Rx1155MappedInv; // inverse KV

    function totalBridgedERC1155() external view returns (uint256, uint256) {
        return (Tx1155Tokens.length, Rx1155Tokens.length);
    }

    function issueERC1155MapReq(IERC1155Upgradeable thisSideToken)
        external
    {
        require(
            Tx1155Mapped[address(thisSideToken)] == address(0),
            "token is already mapped"
        );

        emit ERC1155MapReq(
            address(thisSideToken)
        );
    }

    function onERC1155MapReqEvent(bytes32[] memory topics, bytes memory data)
        internal
    {
        // event TokenMapReq(address indexed tokenReq, uint256 decimals, string name, string symbol);
        address tokenReq = address(uint160(uint256(topics[1])));
        require(
            address(Rx1155Mapped[tokenReq]) == address(0),
            "bridge already exist"
        );
        bytes32 salt = bytes32(uint256(uint160(tokenReq)));
        BridgeERC1155 mintAddress = new BridgeERC1155{salt: salt}();
        mintAddress.initialize();
        Rx1155MappedInv[address(mintAddress)] = tokenReq;
        Rx1155Mapped[tokenReq] = mintAddress;
        Rx1155Tokens.push(mintAddress);
        emit ERC1155MapAck(tokenReq, address(mintAddress));
    }

    function onTokenERC1155AckEvent(bytes32[] memory topics)
        internal
    {
        address tokenReq = address(uint160(uint256(topics[1])));
        address tokenAck = address(uint160(uint256(topics[2])));
        require(
            Tx1155Mapped[tokenReq] == address(0),
            "missing mapping to acknowledge"
        );
        Tx1155Mapped[tokenReq] = tokenAck;
        Tx1155MappedInv[tokenAck] = IERC1155Upgradeable(tokenReq);
        Tx1155Tokens.push(IERC1155Upgradeable(tokenReq));
    }
}
