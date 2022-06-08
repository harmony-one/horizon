// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./EthereumParser.sol";
import "./lib/EthUtils.sol";
import "./ethash/ethash.sol";

/// @title Ethereum light client
contract EthereumLightClient is Ethash, Initializable, PausableUpgradeable {
    using SafeMathUpgradeable for uint256;
    
    struct StoredBlockHeader {
        uint256 parentHash;
        uint256 stateRoot;
        uint256 transactionsRoot;
        uint256 receiptsRoot;
        uint256 number;
        uint256 difficulty;
        uint256 totalDifficulty;
        uint256 time;
        uint256 hash;
    }

    struct HeaderInfo {
        uint256 total_difficulty;
        bytes32 parent_hash;
        uint64 number;
    }

    // The first block header hash
    uint256 public firstBlock;

    // Block header hash of the current canonical chain head
    uint256 public canonicalHead;

    //Blocks existing in the current canonical chain, in the form blockHeaderHash => bool
    mapping(uint256 => bool) public canonicalBlocks;

    // Blocks data, in the form: blockHeaderHash => BlockHeader
    mapping(uint256 => StoredBlockHeader) public blocks;

    // Block existing map, in the form: blockHeaderHash => bool
    mapping(uint256 => bool) public blockExisting;

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

    uint256 private constant DEFAULT_FINALITY_CONFIRMS = 13;

    uint256 public finalityConfirms;

    // number of the oldest block that stored, we use this to prune the expired blocks from state
    uint256 public oldestBlockStored;
    uint256 private constant BLOCK_EXPIRED = 30 days;
    uint256 private constant MAX_PRUNE_ONCE = 16;

    function initialize(bytes memory _rlpHeader) external initializer {
        finalityConfirms = DEFAULT_FINALITY_CONFIRMS;

        uint256 blockHash = EthereumParser.calcBlockHeaderHash(_rlpHeader);
        // Parse rlp-encoded block header into structure
        EthereumParser.BlockHeader memory header = EthereumParser
            .parseBlockHeader(_rlpHeader);
        // Save block header info
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash: header.parentHash,
            stateRoot: header.stateRoot,
            transactionsRoot: header.transactionsRoot,
            receiptsRoot: header.receiptsRoot,
            number: header.number,
            difficulty: header.difficulty,
            totalDifficulty : header.difficulty,
            time: header.timestamp,
            hash: blockHash
        });
        _setFirstBlock(storedBlock);
    }

    function _deleteBlock(uint256 blockNo) private {
        uint256[] storage blockHashes = blocksByHeight[blockNo];
        for(uint256 j = 0; j < blockHashes.length; j++) {
            uint256 blockHash = blockHashes[j];
            delete blocks[blockHash];
            delete blockExisting[blockHash];
        }
        delete blocksByHeight[blockNo];
        delete blocksByHeightExisting[blockNo];
        delete canonicalBlocks[blockNo];
    }
 
    function _pruneBlocks(uint256 pruneTime) private {
        uint256 blockCur = oldestBlockStored;
        for(uint256 i = 0; i < MAX_PRUNE_ONCE; i++) {
            uint256 blockNo = blockCur++;
            if(!blocksByHeightExisting[blockNo]) continue;
            uint256 blockHash = blocksByHeight[blockNo][0];
            if(blocks[blockHash].time > pruneTime) break;
            _deleteBlock(blockNo);
        }
        if(blockCur > oldestBlockStored) oldestBlockStored = blockCur;
    }

    //uint32 constant loopAccesses = 64;      // Number of accesses in hashimoto loop
    function addBlockHeader(
        bytes memory _rlpHeader,
        bytes32[4][loopAccesses] memory cache,
        bytes32[][loopAccesses] memory proofs
    ) public whenNotPaused returns (bool) {
        _pruneBlocks(block.timestamp - BLOCK_EXPIRED);
        // Calculate block header hash
        uint256 blockHash = EthereumParser.calcBlockHeaderHash(_rlpHeader);
        // Check block existing
        require(
            !blockExisting[blockHash],
            "Relay block failed: block already relayed"
        );

        // Parse rlp-encoded block header into structure
        EthereumParser.BlockHeader memory header = EthereumParser
            .parseBlockHeader(_rlpHeader);

        // Check the existence of parent block
        require(
            blockExisting[header.parentHash],
            "Relay block failed: parent block not relayed yet"
        );

        // Check block height
        require(
            header.number == blocks[header.parentHash].number.add(1),
            "Relay block failed: invalid block blockHeightMax"
        );

        // Check timestamp
        require(
            header.timestamp > blocks[header.parentHash].time,
            "Relay block failed: invalid timestamp"
        );

        // Check difficulty
        require(
            _checkDiffValidity(
                header.difficulty,
                blocks[header.parentHash].difficulty
            ),
            "Relay block failed: invalid difficulty"
        );

        // Verify block PoW
        uint256 sealHash = EthereumParser.calcBlockSealHash(_rlpHeader);
        bool rVerified = verifyEthash(
            bytes32(sealHash),
            uint64(header.nonce),
            uint64(header.number),
            cache,
            proofs,
            header.difficulty,
            header.mixHash
        );
        require(rVerified, "Relay block failed: invalid PoW");

        // Save block header info
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash: header.parentHash,
            stateRoot: header.stateRoot,
            transactionsRoot: header.transactionsRoot,
            receiptsRoot: header.receiptsRoot,
            number: header.number,
            difficulty: header.difficulty,
            totalDifficulty : blocks[header.parentHash].totalDifficulty.add(header.difficulty),
            time: header.timestamp,
            hash: blockHash
        });

        blocks[blockHash] = storedBlock;
        blockExisting[blockHash] = true;
        // verifiedBlocks[blockHash] = true;

        blocksByHeight[header.number].push(blockHash);
        blocksByHeightExisting[header.number] = true;

        if (header.number > blockHeightMax) {
            blockHeightMax = header.number;
        }

        //Check if this block is ahead of the canonical head
        if(header.parentHash == canonicalHead){
            canonicalHead = blockHash;
            canonicalBlocks[blockHash] = true;
        }
        //Check if the canonical chain needs to be replaced by another fork
        else if(blocks[canonicalHead].totalDifficulty < blocks[blockHash].totalDifficulty){
            _updateCanonicalChain(blockHash);
        }

        return true;
    }

    //Iterate backward through blocks from this block to find where the canonical chain converges with this fork
    //Consider also that there may be no point of convergence, so in that case stop iterating when block's parent hash stops exiting in the blocks mapping
    //Mark All blocks along the way as part of the canonical chain
    function _updateCanonicalChain(
        uint256 _blockHash
    )
        internal
    {
        uint256 current = _blockHash;

        //Iterate backward from new head marking the blocks as part of the canonical chain
        while(!canonicalBlocks[current] && blockExisting[current]){ //Second part of if statement if for replacing whole canonical chain
            canonicalBlocks[current] = true;
            current = blocks[current].parentHash;
        }

        //current now represents either our point of convergence, or the block one before the first blocked stored in the ELC
        uint256 convergenceOrFirstBlock = current;
        current = canonicalHead;

        //Remove blocks from canonical chain until either point of convergence, or until the chain leaves range of storage
        while(current != convergenceOrFirstBlock && blockExisting[current]){
            canonicalBlocks[current] = false;
            current = blocks[current].parentHash;
        }

        canonicalHead = _blockHash;

    }

    function isVerified(uint256 blockHash)
        public
        view
        returns (bool)
    {
        //Check that block is in canonical chain and has at least 25 confirmations
        return canonicalBlocks[blockHash] && blocks[blockHash].number + 25 < blocks[canonicalHead].number;
    }

    function isFinalized(uint256 blockHash)
        public
        view
        returns (bool)
    {
        return canonicalBlocks[blockHash] && blocks[blockHash].number + 200 < blocks[canonicalHead].number;
    }

    function numberOfBlockConfirmations(uint256 blockHash)
        public
        view
        returns (uint256)
    {
        if(!canonicalBlocks[blockHash]) return 0;
        else return blocks[canonicalHead].number - blocks[blockHash].number;
    }

    function getBlockHeightMax() public view returns (uint256) {
        return blockHeightMax;
    }

    function getStateRoot(bytes32 blockHash) public view returns (bytes32) {
        return bytes32(blocks[uint256(blockHash)].stateRoot);
    }

    function getTxRoot(bytes32 blockHash) public view returns (bytes32) {
        return bytes32(blocks[uint256(blockHash)].transactionsRoot);
    }

    function getReceiptRoot(bytes32 blockHash) public view returns (bytes32) {
        return bytes32(blocks[uint256(blockHash)].receiptsRoot);
    }

    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash)
        external
        view
        returns (bool)
    {
        return bytes32(blocks[uint256(blockHash)].receiptsRoot) == receiptsHash;
    }

    // Check the difficulty of block is valid or not
    // (the block difficulty adjustment is described here: https://github.com/ethereum/EIPs/issues/100)
    // Note that this is only 'minimal check' because we do not have 'block uncles' information to calculate exactly.
    // 'Minimal check' is enough to prevent someone from spamming relaying blocks with quite small difficulties
    function _checkDiffValidity(uint256 diff, uint256 parentDiff)
        private
        pure
        returns (bool)
    {
        return diff >= parentDiff.sub((parentDiff / 10000) * 99);
    }

    function _setFirstBlock(StoredBlockHeader memory toSetBlock) private {
        firstBlock = toSetBlock.hash;

        blocks[toSetBlock.hash] = toSetBlock;
        blockExisting[toSetBlock.hash] = true;

        blocksByHeight[toSetBlock.number].push(toSetBlock.hash);
        blocksByHeightExisting[toSetBlock.number] = true;

        blockHeightMax = toSetBlock.number;

        longestBranchHead[toSetBlock.hash] = toSetBlock.hash;

        canonicalHead = firstBlock;

        canonicalBlocks[firstBlock] = true;

        oldestBlockStored = toSetBlock.number;
    }
}
