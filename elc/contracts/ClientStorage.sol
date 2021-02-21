pragma solidity ^0.6.2;

/**
 * The ClientStorage contract contains underlying data for EthNtyRelay contract
 */
 contract ClientStorage {
 	struct StoredBlockHeader {
 		uint parentHash;
 		uint stateRoot;
 		uint transactionsRoot;
 		uint receiptsRoot;
 		uint number;
 		uint difficulty;
 		uint time;
 		uint hash;
 	}

 	// The first block header hash
 	uint public firstBlock;

    // Blocks data, in the form: blockHeaderHash => BlockHeader
    mapping (uint => StoredBlockHeader) public blocks;
    // Block existing map, in the form: blockHeaderHash => bool
    mapping (uint => bool) public blockExisting;
    // Blocks in 'Verified' state
    mapping (uint => bool) public verifiedBlocks;
    // Blocks in 'Finalized' state
    mapping (uint => bool) public finalizedBlocks;

    // Valid relayed blocks for a block height, in the form: blockNumber => blockHeaderHash[]
    mapping (uint => uint[]) public blocksByHeight;
    // Block height existing map, in the form: blockNumber => bool
    mapping (uint => bool) public blocksByHeightExisting;

    // Max block height stored
    uint public blockHeightMax;

 	// Block header hash that points to longest chain head
 	// (please note that 'longest' chain is based on total difficulty)
 	// uint public longestChainHead;

	 // Longest branch head of each checkpoint, in the form: (checkpoint block hash) => (head block hash)
	 // (note that 'longest branch' means the branch which has biggest cumulative difficulty from checkpoint)
	 mapping(uint => uint) public longestBranchHead;

 	constructor() public {

 	}
 }

