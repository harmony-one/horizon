pragma solidity ^0.5.0;

import "@openzeppelin/contracts//ownership/Ownable.sol";

interface ILightClient {
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external returns(bool);
}

contract LightClientUnsafe is ILightClient {
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) public returns(bool) {
        blockHash;receiptsHash;
        return true;
    }
}

contract LightClientTrust is ILightClient,Ownable {
    constructor() Ownable() public {}
    mapping(bytes32=>bytes32) public Receipts;
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) public returns(bool) {
        return Receipts[blockHash] == receiptsHash;
    }

    function FeedReeipts(bytes32 blockHash, bytes32 receiptsHash) public onlyOwner {
        Receipts[blockHash] = receiptsHash;
    }
}