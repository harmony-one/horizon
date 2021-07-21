// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "truffle/Assert.sol";
import "../lib/MMR.sol";

/**
 * I wrote this solidity test file just to show how to use this library
 * More detail test cases are written in javascript. Please see TestMMR.js
 */
contract TestMMR {
    using MMR for MMR.Tree;
    MMR.Tree mmr;

    /**
     * Appending 10 items will construct a Merkle Mountain Range like below
     *              15
     *       7             14
     *    3      6     10       13       18
     *  1  2   4  5   8  9    11  12   16  17
     */
    function testMerkleMountainRange() public {
        mmr.append('0x0001'); // stored at index 1
        mmr.append('0x0002'); // stored at index 2
        mmr.append('0x0003'); // stored at index 4
        mmr.append('0x0004'); // stored at index 5
        mmr.append('0x0005'); // stored at index 8
        mmr.append('0x0006'); // stored at index 9
        mmr.append('0x0007'); // stored at index 11
        mmr.append('0x0008'); // stored at index 12
        mmr.append('0x0009'); // stored at index 16
        mmr.append('0x000a'); // stored at index 17

        uint256 index = 17;
        // Get a merkle proof for index 17
        (bytes32 root, uint256 size, bytes32[] memory peakBagging, bytes32[] memory siblings) = mmr.getMerkleProof(index);
        // using MMR library verify the root includes the leaf
        Assert.isTrue(MMR.inclusionProof(root, size, index, '0x000a', peakBagging, siblings), "should return true or reverted");
    }

    // function testRollUp() public {
    //     bytes[] memory data = new bytes[](7);
    //     data[0] = bytes("0x000b");
    //     data[1] = bytes("0x000c");
    //     data[2] = bytes("0x000d");
    //     data[3] = bytes("0x000e");
    //     data[4] = bytes("0x000f");
    //     data[5] = bytes("0x0010");
    //     data[6] = bytes("0x0011");
    //     bytes32[] memory hashes = new bytes32[](7);
    //     hashes[0] = keccak256(data[0]);
    //     hashes[1] = keccak256(data[1]);
    //     hashes[2] = keccak256(data[2]);
    //     hashes[3] = keccak256(data[3]);
    //     hashes[4] = keccak256(data[4]);
    //     hashes[5] = keccak256(data[5]);
    //     hashes[6] = keccak256(data[6]);
    //     bytes32 newRollUpRoot = MMR.rollUp(
    //         mmr.root,
    //         mmr.width,
    //         mmr.getPeaks(),
    //         hashes
    //     );
    //     for(uint i = 0; i < 7; i++) {
    //         mmr.append(data[i]);
    //     }
    //     Assert.isTrue(mmr.root == newRollUpRoot, "Roll up shows different result");
    // }
}
