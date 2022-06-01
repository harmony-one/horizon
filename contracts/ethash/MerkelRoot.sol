// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

contract MerkelRoots {
    uint64 constant epochStart = 409;
    uint64 constant epochEnd = 409;
    bytes constant ROOTS = "\xda\x50\xdb\xcb\xfd\xa2\xc7\xfe\x61\xa5\x5e\x6b\x0f\x12\x43\xe0\x3c\x1a\x67\xe6\x7f\xa7\x31\xcd\xd8\xfc\x99\x0c\x71\x66\x81\xa5";

    function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
        bytes memory roots = ROOTS;
        require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
        uint256 index = epoch - epochStart + 1; // skip length
        assembly{
            hash := mload(add(roots, mul(index, 0x20)))
        }
    }
}

