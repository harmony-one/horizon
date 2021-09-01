// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;

/**
 * The ClientStorage contract contains underlying data for EthNtyRelay contract
 */
contract EthereumLightClientStorage {
    struct StoredBlockHeader {
        uint256 parentHash;
        uint256 stateRoot;
        uint256 transactionsRoot;
        uint256 receiptsRoot;
        uint256 number;
        uint256 difficulty;
        uint256 time;
        uint256 hash;
    }

    // The first block header hash
    uint256 public firstBlock;

    // Blocks data, in the form: blockHeaderHash => BlockHeader
    mapping(uint256 => StoredBlockHeader) public blocks;

    // Block existing map, in the form: blockHeaderHash => bool
    mapping(uint256 => bool) public blockExisting;

    // Blocks in 'Verified' state
    mapping(uint256 => bool) public verifiedBlocks;

    // Blocks in 'Finalized' state
    mapping(uint256 => bool) public finalizedBlocks;

    // Valid relayed blocks for a block height, in the form: blockNumber => blockHeaderHash[]
    mapping(uint256 => uint256[]) public blocksByHeight;

    // Block height existing map, in the form: blockNumber => bool
    mapping(uint256 => bool) public blocksByHeightExisting;

    // Max block height stored
    uint256 public blockHeightMax;

    // Block header hash that points to longest chain head
    // (please note that 'longest' chain is based on total difficulty)
    // uint public longestChainHead;

    // Longest branch head of each checkpoint, in the form: (checkpoint block hash) => (head block hash)
    // (note that 'longest branch' means the branch which has biggest cumulative difficulty from checkpoint)
    mapping(uint256 => uint256) public longestBranchHead;

    constructor() public {}
}
