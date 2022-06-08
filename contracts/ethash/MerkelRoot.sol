// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract MerkelRoots {
    uint64 constant epochStart = 410;
    uint64 constant epochEnd = 410;
    bytes constant ROOTS = "\xab\x22\x1c\x85\xc4\x8b\xe4\x70\x02\x11\xf1\x3f\x57\xa2\x56\x7e\xb9\x83\x3d\xd0\xec\x94\x06\xc2\xaf\x6c\xe7\xa0\xdf\x31\x43\x1d";

   function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
       bytes memory roots = ROOTS;
       require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
       uint256 index = epoch - epochStart + 1; // skip length
       assembly{
           hash := mload(add(roots, mul(index, 0x20)))
       }
   }
}

