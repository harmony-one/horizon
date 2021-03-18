pragma solidity ^0.6.2;

import "openzeppelin-solidity/contracts/access/Ownable.sol";

interface ILightClient {
    function blocksByHeight(uint, uint) external returns(uint); // block number => block hash[]
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external returns(bool);
}

contract LightClientFake is ILightClient {
    function blocksByHeight(uint number, uint) external override returns(uint) {
        return uint(keccak256(abi.encode(number)));
    }
    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) override external returns(bool) {
        blockHash;receiptsHash;
        return true;
    }
}
