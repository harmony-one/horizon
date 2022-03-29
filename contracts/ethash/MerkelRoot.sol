// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

contract MerkelRoots {
    uint64 constant epochStart = 404;
    uint64 constant epochEnd = 404;
    bytes constant ROOTS = "\xeb\xe5\x0d\xbd\x91\x67\x46\xb5\x6e\x58\x86\x9e\x26\x48\x5d\x14\x0f\x92\x86\x6d\x59\xfb\xb8\x94\x40\x5d\x8c\x7e\xf0\x7b\x10\x86";

   function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
       bytes memory roots = ROOTS;
       require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
       uint256 index = epoch - epochStart + 1; // skip length
       assembly{
           hash := mload(add(roots, mul(index, 0x20)))
       }
   }
}