pragma solidity ^0.6.2;

import "openzeppelin-solidity/contracts/access/Ownable.sol";

interface ILightClient {
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external returns(bool);
}

contract LightClientUnsafe is ILightClient {
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) override public returns(bool) {
        blockHash;receiptsHash;
        return true;
    }
}

contract LightClientTrust is ILightClient,Ownable {
    constructor() Ownable() public {}
    mapping(bytes32=>bytes32) public Receipts;
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) override public returns(bool) {
        return Receipts[blockHash] == receiptsHash;
    }

    function FeedReeipts(bytes32 blockHash, bytes32 receiptsHash) public onlyOwner {
        Receipts[blockHash] = receiptsHash;
    }
}