// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract MerkelRoots {
    uint64 constant epochStart = 411;
    uint64 constant epochEnd = 411;
    bytes constant ROOTS = "\xf8\x7d\x60\x5d\xd4\xbd\xaf\xc3\x9b\x13\xb4\x5b\x6a\xbf\x6b\x92\x11\x96\xb0\xf3\xb5\xd7\xc5\x1b\x31\x82\x06\x64\x10\x4a\x69\x7d";

    function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
        bytes memory roots = ROOTS;
        require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
        uint256 index = epoch - epochStart + 1; // skip length
        assembly{
            hash := mload(add(roots, mul(index, 0x20)))
        }
    }
}

