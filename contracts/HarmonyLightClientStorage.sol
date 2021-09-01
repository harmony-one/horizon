// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;

import "./lib/MMRWrapper.sol";

contract HarmonyLightClientStorage {
    struct BlockHeader {
        uint256 parentHash;
        uint256 stateRoot;
        uint256 transactionsRoot;
        uint256 receiptsRoot;
        uint256 number;
        uint256 epoch;
        uint256 shard;
        uint256 time;
        uint256 hash;
    }

    struct State {
        uint256 epoch;
        Committee[] shards;
    }

    struct Committee {
        uint256 shardID;
        Slot[] slots;
    }

    struct Slot {
        address ecdsaAddress;
        bytes blsPubKey;
        uint128 stake;
    }

    mapping(uint256 => mapping(uint256 => bytes)) epochShardCommittees;

    mapping(uint256 => BlockHeader) public blocks;
    mapping(uint256 => bytes32) blockHashes;
    mapping(uint256 => bytes32) epochBlockHashes;
    mapping(uint256 => MMRWrapper) epochMMRTrees;
    MMRWrapper public currentMMRTree;

    constructor() {
        currentMMRTree = new MMRWrapper();
    }

    function finalizeEpoch(uint256 epoch) public {
        epochMMRTrees[epoch] = currentMMRTree;
        currentMMRTree = new MMRWrapper();
    }
}
