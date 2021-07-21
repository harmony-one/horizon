// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./HarmonyParser.sol";

interface IHarmonyLightClient {
    // function blockHashes(uint64 blockNumber) external view returns (bytes32);
    function getConfirmedBlockHash(uint256 number)
        external
        view
        returns (bytes32 hash);
}

contract HarmonyLightClient is IHarmonyLightClient {
    bytes public mmrRoot;
    bool public status;
    uint256 public blockHash;
    bytes32 public blockHash1;
    bytes public sig;

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
