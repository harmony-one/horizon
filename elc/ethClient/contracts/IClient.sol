pragma solidity ^0.5.0;

interface IClient {
   function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external view returns (bool);
}