
pragma solidity ^0.6.2;

contract MerkelRoots {
    uint64 constant epochStart = 386;
    uint64 constant epochEnd = 386;
    bytes constant ROOTS = "\xaa\x35\xd6\xe6\x49\xed\xf7\x9b\x9e\x83\xe1\xc8\xf1\xf8\x77\x8a\x5c\x18\xba\x28\x06\x6c\x88\x59\x03\x97\x44\xac\x01\x5c\x0a\xda";
    
   function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
       bytes memory roots = ROOTS;
       require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
       uint256 index = epoch - epochStart + 1; // skip length
       assembly{
           hash := mload(add(roots, mul(index, 0x20)))
       }
   }
}
