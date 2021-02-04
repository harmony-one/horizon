
pragma solidity ^0.6.2;

contract MerkelRoots {
    uint64 constant epochStart = 387;
    uint64 constant epochEnd = 387;
    bytes constant ROOTS = "\x58\xe6\xb0\x93\x46\x3d\x54\x6a\xa9\x8c\x47\x30\xe2\x29\x04\xd1\x61\x93\xf3\xdd\x9d\xf3\x6c\x46\x8c\x27\xa5\x8c\xb9\xb5\xa8\x6e";
    
   function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
       bytes memory roots = ROOTS;
       require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
       uint256 index = epoch - epochStart + 1; // skip length
       assembly{
           hash := mload(add(roots, mul(index, 0x20)))
       }
   }
}
