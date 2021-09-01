// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./HarmonyParser.sol";
import "./HarmonyLightClientStorage.sol";
import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";

interface IHarmonyLightClient {
    // function blockHashes(uint64 blockNumber) external view returns (bytes32);
    function getConfirmedBlockHash(uint256 number)
        external
        view
        returns (bytes32 hash);
}

contract HarmonyLightClient is HarmonyLightClientStorage, IHarmonyLightClient {
    using SafeMath for uint256;

    bytes public mmrRoot;
    bool public status;
    uint256 public blockHash;
    bytes32 public blockHash1;
    bytes public sig;

    constructor(bytes memory rlpHeader) public {
        uint256 blockHash = HarmonyParser.calcBlockHeaderHash(rlpHeader);
        HarmonyParser.BlockHeader memory header = HarmonyParser.toBlockHeader(rlpHeader);
    }


    function submitCheckpoint(bytes memory rlpHeader, bytes memory commitSig, bytes memory commitBitmap, bytes memory blockHashes) public returns (bool status) {
        // bls verify the block header for quorum & signatures

        // epoch block
        // if (header.shardState.length > 0) {
        //     // store shard committees for the next epoch
        // }

        // append the blockHashes to MMR tree and check if the root matches the MMRRoot of the block header

        // current blockHash becomes the first node of new epoch MMR tree
    }

    function addBlock(bytes memory rlpHeader, bytes memory keys) public {
        HarmonyParser.BlockHeader memory header = HarmonyParser.toBlockHeader(
            rlpHeader
        );
        mmrRoot = header.mmrRoot;
        blockHash = uint256(keccak256(rlpHeader));
        blockHash1 = keccak256(rlpHeader);
        sig = header.lastCommitSignature;

        // epoch block
        if (header.shardState.length > 0) {}
    }

    function getConfirmedBlockHash(uint256 number)
        public
        view
        override
        returns (bytes32 hash)
    {
        // return number <= lastConfirmed ? blockHashes[number] : bytes32(0);
        return bytes32(0);
    }
}
