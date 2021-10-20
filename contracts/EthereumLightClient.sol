// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
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

    uint256 private constant DEFAULT_FINALITY_CONFIRMS = 13;

    uint256 public finalityConfirms;

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
            time: header.timestamp,
            hash: blockHash
        });
        _setFirstBlock(storedBlock);
    }

    //uint32 constant loopAccesses = 64;      // Number of accesses in hashimoto loop
    function addBlockHeader(
        bytes memory _rlpHeader,
        bytes32[4][loopAccesses] memory cache,
        bytes32[][loopAccesses] memory proofs
    ) public whenNotPaused returns (bool) {
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

        return true;
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

        verifiedBlocks[toSetBlock.hash] = true;
        finalizedBlocks[toSetBlock.hash] = true;

        blocksByHeight[toSetBlock.number].push(toSetBlock.hash);
        blocksByHeightExisting[toSetBlock.number] = true;

        blockHeightMax = toSetBlock.number;

        longestBranchHead[toSetBlock.hash] = toSetBlock.hash;
    }
}
