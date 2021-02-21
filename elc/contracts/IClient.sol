pragma solidity ^0.6.2;

interface IClient {
   function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external view returns (bool);
}