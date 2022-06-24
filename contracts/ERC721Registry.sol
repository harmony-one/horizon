// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "./BridgeERC721.sol";

contract ERC721Registry {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;

    event ERC721MapReq(
        address indexed tokenReq,
        string name,
        string symbol
    );

    event ERC721MapAck(address indexed tokenReq, address indexed tokenAck);

    bytes32 constant ERC721MapReqEventSig =
        keccak256("ERC721MapReq(address,string,string)");
    bytes32 constant ERC721MapAckEventSig =
        keccak256("ERC721MapAck(address,address)");

    IERC721Upgradeable[] public TxTokens; // thisSide locked ERC721 list
    BridgeERC721[] public RxTokens; // bridged token list, keys of

    // TX means token issued in this chain, and cross to another chain
    mapping(address => address) public TxMapped; // thisSide locked => otherSide mint
    mapping(address => IERC721Upgradeable) public TxMappedInv; // inverse KV

    // RX means token issued in another chain, and cross to this chain.
    mapping(address => BridgeERC721) public RxMapped; // otherSide locked => thisSide mint
    mapping(address => address) public RxMappedInv; // inverse KV

    function totalBridgedERC721() external view returns (uint256, uint256) {
        return (TxTokens.length, RxTokens.length);
    }

    function issueERC721MapReq(IERC721Upgradeable thisSideToken)
        external
    {
        require(
            TxMapped[address(thisSideToken)] == address(0),
            "token is already mapped"
        );

        bytes memory data = abi.encodeWithSignature(
            'name()'
        );
        (bool success, bytes memory resultData) = address(thisSideToken).call(
            data
        );
        string memory name;
        if(success){
            name = abi.decode(resultData, (string));
        }
        else{
            name = "Unnamed ERC721";
        }

        data = abi.encodeWithSignature(
            'name()'
        );
        (success, resultData) = address(thisSideToken).call(
            data
        );
        string memory symbol;
        if(success){
            symbol = abi.decode(resultData, (string));
        }
        else{
            symbol = "TOKEN";
        }

        emit ERC721MapReq(
            address(thisSideToken),
            name,
            symbol
        );
    }

    function onERC721MapReqEvent(bytes32[] memory topics, bytes memory data)
        internal
    {
        // event TokenMapReq(address indexed tokenReq, uint256 decimals, string name, string symbol);
        address tokenReq = address(uint160(uint256(topics[1])));
        require(
            address(RxMapped[tokenReq]) == address(0),
            "bridge already exist"
        );
        (string memory name, string memory symbol) = abi.decode(
            data,
            (string, string)
        );
        bytes32 salt = bytes32(uint256(uint160(tokenReq)));
        BridgeERC721 mintAddress = new BridgeERC721{salt: salt}();
        mintAddress.initialize(
            name,
            symbol
        );
        RxMappedInv[address(mintAddress)] = tokenReq;
        RxMapped[tokenReq] = mintAddress;
        RxTokens.push(mintAddress);
        emit TokenMapAck(tokenReq, address(mintAddress));
    }

    function onTokenERC721AckEvent(bytes32[] memory topics)
        internal
    {
        address tokenReq = address(uint160(uint256(topics[1])));
        address tokenAck = address(uint160(uint256(topics[2])));
        require(
            TxMapped[tokenReq] == address(0),
            "missing mapping to acknowledge"
        );
        TxMapped[tokenReq] = tokenAck;
        TxMappedInv[tokenAck] = IERC721Upgradeable(tokenReq);
        TxTokens.push(IERC721Upgradeable(tokenReq));
    }
}
