pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import {SafeMath} from 'openzeppelin-solidity/contracts/math/SafeMath.sol';
// import {BytesLib} from '@summa-tx/bitcoin-spv-sol/contracts/BytesLib.sol';
// import {BTCUtils} from '@summa-tx/bitcoin-spv-sol/contracts/BTCUtils.sol';
// import {ValidateSPV} from '@summa-tx/bitcoin-spv-sol/contracts/ValidateSPV.sol';
import './ClientStorage.sol';

import "./EthCommon.sol";
import "./EthUtils.sol";
import "./ethash/ethash.sol";
//import "./IClient.sol";

/// @title Ethereum light client
contract Client is ClientStorage, Ethash {
    using SafeMath for uint256;
    // using BytesLib for bytes;
    // using BTCUtils for bytes;


    struct HeaderInfo {
       uint256 total_difficulty;
       bytes32  parent_hash;
       uint64  number;
    }

    // // NEAR rainbow
    // /// Whether client validates the PoW when accepting the header. Should only be set to `false`
    // /// for debugging, testing, diagnostic purposes when used with Ganache.
    // bool validate_ethash;
    // /// The epoch from which the DAG merkle roots start.
    // uint64 dags_start_epoch;
    // /// DAG merkle roots for the next several years.
    // bytes32[] dags_merkle_roots;
    // /// Hash of the header that has the highest cumulative difficulty. The current head of the
    // /// canonical chain.
    // bytes32 best_header_hash;
    // /// We store the hashes of the blocks for the past `hashes_gc_threshold` headers.
    // /// Events that happen past this threshold cannot be verified by the client.
    // /// It is desirable that this number is larger than 7 days worth of headers, which is roughly
    // /// 40k Ethereum blocks. So this number should be 40k in production.
    // uint64 hashes_gc_threshold;
    // /// We store full information about the headers for the past `finalized_gc_threshold` blocks.
    // /// This is required to be able to adjust the canonical chain when the fork switch happens.
    // /// The commonly used number is 500 blocks, so this number should be 500 in production.
    // uint64 finalized_gc_threshold;
    // /// Number of confirmations that applications can use to consider the transaction safe.
    // /// For most use cases 25 should be enough, for super safe cases it should be 500.
    // uint64 num_confirmations;
    // /// Hashes of the canonical chain mapped to their numbers. Stores up to `hashes_gc_threshold`
    // /// entries.
    // /// header number -> header hash
    // mapping(uint64 => bytes32) public canonical_header_hashes;
    // /// All known header hashes. Stores up to `finalized_gc_threshold`.
    // /// header number -> hashes of all headers with this number.
    // mapping(uint64 => bytes32[]) public all_header_hashes;
    // /// Known headers. Stores up to `finalized_gc_threshold`.
    // mapping(uint => EthCommon.BlockHeader) public headers;
    // /// Minimal information about the headers, like cumulative difficulty. Stores up to
    // /// `finalized_gc_threshold`.
    // mapping(uint => HeaderInfo) public infos;


    // constructor(
    //     // bool _validate_ethash,
    //     // uint64 _dags_start_epoch,
    //     // bytes32[] memory _dags_merkle_roots,
    //     // bytes32[] memory _first_header,
    //     // uint64 _hashes_gc_threshold,
    //     // uint64 _finalized_gc_threshold,
    //     // uint64 _num_confirmations
    // ) public {
    //     // validate_ethash = _validate_ethash;
    //     // dags_start_epoch = _dags_start_epoch;
    //     // dags_merkle_roots = _dags_merkle_roots;
    //     // first_header = _first_header;
    //     // hashes_gc_threshold = _hashes_gc_threshold;
    //     // finalized_gc_threshold = _finalized_gc_threshold;
    //     // num_confirmations = _num_confirmations;
    // }

    uint constant private DEFAULT_FINALITY_CONFIRMS = 13;

    uint public finalityConfirms;

    constructor(bytes memory _rlpHeader) public {
        finalityConfirms = DEFAULT_FINALITY_CONFIRMS;

        uint blockHash = EthCommon.calcBlockHeaderHash(_rlpHeader);
        // Parse rlp-encoded block header into structure
        EthCommon.BlockHeader memory header = EthCommon.parseBlockHeader(_rlpHeader);
        // Save block header info
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash : header.parentHash,
            stateRoot : header.stateRoot,
            transactionsRoot : header.transactionsRoot,
            receiptsRoot : header.receiptsRoot,
            number : header.number,
            difficulty : header.difficulty,
            time : header.timestamp,
            hash : blockHash
            });
        _setFirstBlock(storedBlock);
    }

	//uint32 constant loopAccesses = 64;      // Number of accesses in hashimoto loop
    function addBlockHeader(bytes memory _rlpHeader, bytes32[4][loopAccesses] memory cache, bytes32[][loopAccesses] memory proofs) public returns (bool) {
        // Calculate block header hash
        uint blockHash = EthCommon.calcBlockHeaderHash(_rlpHeader);
        // Check block existing
        require(!blockExisting[blockHash], "Relay block failed: block already relayed");

        // Parse rlp-encoded block header into structure
        EthCommon.BlockHeader memory header = EthCommon.parseBlockHeader(_rlpHeader);

        // Check the existence of parent block
        require(blockExisting[header.parentHash], "Relay block failed: parent block not relayed yet");

        // Check block height
        require(header.number == blocks[header.parentHash].number.add(1), "Relay block failed: invalid block blockHeightMax");

        // Check timestamp
        require(header.timestamp > blocks[header.parentHash].time, "Relay block failed: invalid timestamp");

        // Check difficulty
        require(_checkDiffValidity(header.difficulty, blocks[header.parentHash].difficulty), "Relay block failed: invalid difficulty");

        // Verify block PoW
        uint sealHash = EthCommon.calcBlockSealHash(_rlpHeader);
        bool rVerified = verifyEthash(bytes32(sealHash), uint64(header.nonce), uint64(header.number), cache, proofs, header.difficulty, header.mixHash);
        require(rVerified, "Relay block failed: invalid PoW");

        // Save block header info
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash : header.parentHash,
            stateRoot : header.stateRoot,
            transactionsRoot : header.transactionsRoot,
            receiptsRoot : header.receiptsRoot,
            number : header.number,
            difficulty : header.difficulty,
            time : header.timestamp,
            hash : blockHash
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

    function getBlockHeightMax() view public returns (uint256) {
        return blockHeightMax;
    }

    function getStateRoot(bytes32 blockHash) view public returns (bytes32) {
        return bytes32(blocks[uint(blockHash)].stateRoot);
    }

    function getTxRoot(bytes32 blockHash) view public returns (bytes32) {
        return bytes32(blocks[uint(blockHash)].transactionsRoot);
    }

    function getReceiptRoot(bytes32 blockHash) view public returns (bytes32) {
        return bytes32(blocks[uint(blockHash)].receiptsRoot);
    }

    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external view returns (bool) {
        return bytes32(blocks[uint(blockHash)].receiptsRoot) == receiptsHash;
    }

    // Check the difficulty of block is valid or not
    // (the block difficulty adjustment is described here: https://github.com/ethereum/EIPs/issues/100)
    // Note that this is only 'minimal check' because we do not have 'block uncles' information to calculate exactly.
    // 'Minimal check' is enough to prevent someone from spamming relaying blocks with quite small difficulties
    function _checkDiffValidity(uint diff, uint parentDiff) private pure returns (bool){
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


    // Set the first block
    function _defineFirstBlock() internal pure returns (StoredBlockHeader memory)  {
        // Hard code the first block is #6419330
        StoredBlockHeader memory ret = StoredBlockHeader({
            parentHash : 0x65d283e7a4ea14e86404c9ad855d59b4a49a9ae4602dd80857c130a8a57de12d,
            stateRoot : 0x87c377f10bfda590c8e3bfa6a6cafeb9736a251439766196ac508cfcbc795a32,
            transactionsRoot : 0xf4cdf600a8b159e94c49f974ea2da5f05516098fab03dd231469e63982a2ab6e,
            receiptsRoot : 0xd8e77b10e522f5f2c1165c74baa0054fca5e90960cdf26b99892106f06f100f7,
            number : 6419330,
            difficulty : 2125760053,
            time : 1568874993,
            hash : 0xa73ab1a315660100b28ad2121ce7f9df8cd76d250048e5d0ff2f0f458573a1b8
            });

       return ret;
    }

}