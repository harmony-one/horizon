// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import "./lib/RLPEncode.sol";

library HarmonyParser {
    using RLPReader for bytes;
    using RLPReader for uint256;
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;

    using RLPEncode for bytes;
    using RLPEncode for bytes[];

    struct BlockHeader {
        bytes32 hash;
        bytes32 parentHash;
        address miner;
        bytes32 stateRoot;
        bytes32 transactionsRoot;
        bytes32 receiptsRoot;
        bytes32 outgoingReceiptsRoot;
        bytes32 incomingReceiptsRoot;
        bytes logsBloom;
        uint256 number;
        uint256 gasLimit;
        uint256 gasUsed;
        uint256 timestamp;
        bytes extraData;
        bytes32 mixHash;
        uint256 viewID;
        uint256 epoch;
        uint256 shardID;
        bytes lastCommitSignature;
        bytes lastCommitBitmap;
        bytes vrf;
        bytes vdf;
        bytes shardState;
        bytes crossLink;
        bytes slashes;
        bytes mmrRoot;
    }

    struct Account {
        uint256 nonce;
        uint256 balance;
        bytes32 storageRoot;
        bytes32 codeHash;
    }

    struct Transaction {
        uint256 nonce;
        uint256 gasPrice;
        uint256 gas;
        uint256 shardID;
        uint256 toShardID;
        address to;
        uint256 value;
        bytes input;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct Log {
        address contractAddress;
        bytes32[] topics;
        bytes data;
    }

    struct TransactionReceipt {
        bytes32 transactionHash;
        uint256 transactionIndex;
        bytes32 blockHash;
        uint256 blockNumber;
        address from;
        address to;
        uint256 gasUsed;
        uint256 cummulativeGasUsed;
        address contractAddress;
        Log[] logs;
        uint256 status; // root?
        bytes logsBloom;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    struct TransactionReceiptTrie {
        uint8 status;
        uint256 gasUsed;
        bytes logsBloom;
        Log[] logs;
    }

    function getBlockRlpData(BlockHeader memory header)
        internal
        pure
        returns (bytes memory data)
    {
        bytes[] memory list = new bytes[](15);

        list[0] = RLPEncode.encodeBytes(abi.encodePacked(header.parentHash));
        list[1] = RLPEncode.encodeAddress(header.miner);
        list[2] = RLPEncode.encodeBytes(abi.encodePacked(header.stateRoot));
        list[3] = RLPEncode.encodeBytes(
            abi.encodePacked(header.transactionsRoot)
        );
        list[4] = RLPEncode.encodeBytes(abi.encodePacked(header.receiptsRoot));
        list[5] = RLPEncode.encodeBytes(
            abi.encodePacked(header.outgoingReceiptsRoot)
        );
        list[6] = RLPEncode.encodeBytes(
            abi.encodePacked(header.incomingReceiptsRoot)
        );
        list[7] = RLPEncode.encodeBytes(header.logsBloom);
        list[8] = RLPEncode.encodeUint(header.number);
        list[9] = RLPEncode.encodeUint(header.gasLimit);
        list[10] = RLPEncode.encodeUint(header.gasUsed);
        list[11] = RLPEncode.encodeUint(header.timestamp);
        list[12] = RLPEncode.encodeBytes(header.extraData);
        list[13] = RLPEncode.encodeBytes(abi.encodePacked(header.mixHash));

        list[14] = RLPEncode.encodeUint(header.viewID);
        list[15] = RLPEncode.encodeUint(header.epoch);
        list[16] = RLPEncode.encodeUint(header.shardID);

        list[17] = RLPEncode.encodeBytes(header.lastCommitSignature);
        list[18] = RLPEncode.encodeBytes(header.lastCommitBitmap);
        list[19] = RLPEncode.encodeBytes(header.vrf);
        list[20] = RLPEncode.encodeBytes(header.vdf);

        list[21] = RLPEncode.encodeBytes(header.shardState);
        list[22] = RLPEncode.encodeBytes(header.crossLink);
        list[23] = RLPEncode.encodeBytes(header.slashes);
        list[24] = RLPEncode.encodeBytes(header.mmrRoot);

        data = RLPEncode.encodeList(list);
    }

    /**
     * Parse RLP-encoded block header into BlockHeader data structure
     *  @param rlpHeader: RLP-encoded block header with data fields order as defined in the BlockHeader struct
     **/
    function toBlockHeader(bytes memory rlpHeader)
        internal
        pure
        returns (BlockHeader memory header)
    {
        RLPReader.Iterator memory it = rlpHeader.toRlpItem().iterator();
        // skip two dummy header fields
        it.next();
        it.next();
        it = it.next().iterator();
        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) header.parentHash = bytes32(it.next().toUint());
            else if (idx == 1) header.miner = it.next().toAddress();
            else if (idx == 2) header.stateRoot = bytes32(it.next().toUint());
            else if (idx == 3)
                header.transactionsRoot = bytes32(it.next().toUint());
            else if (idx == 4)
                header.receiptsRoot = bytes32(it.next().toUint());
            else if (idx == 5)
                header.outgoingReceiptsRoot = bytes32(it.next().toUint());
            else if (idx == 6)
                header.incomingReceiptsRoot = bytes32(it.next().toUint());
            else if (idx == 7) header.logsBloom = it.next().toBytes();
            else if (idx == 8) header.number = it.next().toUint();
            else if (idx == 9) header.gasLimit = it.next().toUint();
            else if (idx == 10) header.gasUsed = it.next().toUint();
            else if (idx == 11) header.timestamp = it.next().toUint();
            else if (idx == 12) header.extraData = it.next().toBytes();
            else if (idx == 13) header.mixHash = bytes32(it.next().toUint());
            else if (idx == 14) header.viewID = it.next().toUint();
            else if (idx == 15) header.epoch = it.next().toUint();
            else if (idx == 16) header.shardID = it.next().toUint();
            else if (idx == 17)
                header.lastCommitSignature = it.next().toBytes();
            else if (idx == 18) header.lastCommitBitmap = it.next().toBytes();
            else if (idx == 19) header.vrf = it.next().toBytes();
            else if (idx == 20) header.vdf = it.next().toBytes();
            else if (idx == 21) header.shardState = it.next().toBytes();
            else if (idx == 22) header.crossLink = it.next().toBytes();
            else if (idx == 23) header.slashes = it.next().toBytes();
            else if (idx == 24) header.mmrRoot = it.next().toBytes();
            else it.next();

            idx++;
        }
        header.hash = keccak256(rlpHeader);
    }

    function getFirstKey(bytes memory keys) public returns (bytes memory) {
        RLPReader.Iterator memory it = keys.toRlpItem().iterator();
        while (it.hasNext()) {
            bytes memory key = it.next().toBytes();
            return key;
        }
    }

    function calcBlockHeaderHash(bytes memory rlpHeader)
        internal
        pure
        returns (uint256)
    {
        return uint256(keccak256(rlpHeader));
    }

    function calcBlockSealHash(bytes memory rlpHeader)
        internal
        pure
        returns (uint256)
    {
        bytes[] memory rlpFields = new bytes[](13);
        RLPReader.Iterator memory it = rlpHeader.toRlpItem().iterator();
        uint256 idx = 0;
        while (it.hasNext() && idx < 13) {
            rlpFields[idx] = it.next().toRlpBytes();
            idx++;
        }

        bytes memory toSealRlpData = rlpFields.encodeList();
        return uint256(keccak256(toSealRlpData));
    }

    function getBlockHash(BlockHeader memory header)
        internal
        pure
        returns (bytes32 hash)
    {
        return keccak256(getBlockRlpData(header));
    }

    function getLog(Log memory log) internal pure returns (bytes memory data) {
        bytes[] memory list = new bytes[](3);
        bytes[] memory topics = new bytes[](log.topics.length);

        for (uint256 i = 0; i < log.topics.length; i++) {
            topics[i] = RLPEncode.encodeBytes(abi.encodePacked(log.topics[i]));
        }

        list[0] = RLPEncode.encodeAddress(log.contractAddress);
        list[1] = RLPEncode.encodeList(topics);
        list[2] = RLPEncode.encodeBytes(log.data);
        data = RLPEncode.encodeList(list);
    }

    function getReceiptRlpData(TransactionReceiptTrie memory receipt)
        internal
        pure
        returns (bytes memory data)
    {
        bytes[] memory list = new bytes[](4);

        bytes[] memory logs = new bytes[](receipt.logs.length);
        for (uint256 i = 0; i < receipt.logs.length; i++) {
            logs[i] = getLog(receipt.logs[i]);
        }

        list[0] = RLPEncode.encodeUint(receipt.status);
        list[1] = RLPEncode.encodeUint(receipt.gasUsed);
        list[2] = RLPEncode.encodeBytes(receipt.logsBloom);
        list[3] = RLPEncode.encodeList(logs);
        data = RLPEncode.encodeList(list);
    }

    function toReceiptLog(bytes memory data)
        internal
        pure
        returns (Log memory log)
    {
        RLPReader.Iterator memory it = RLPReader.toRlpItem(data).iterator();

        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) {
                log.contractAddress = it.next().toAddress();
            } else if (idx == 1) {
                RLPReader.RLPItem[] memory list = it.next().toList();
                log.topics = new bytes32[](list.length);
                for (uint256 i = 0; i < list.length; i++) {
                    bytes32 topic = bytes32(list[i].toUint());
                    log.topics[i] = topic;
                }
            } else if (idx == 2) log.data = it.next().toBytes();
            else it.next();
            idx++;
        }
    }

    function toReceipt(bytes memory data)
        internal
        pure
        returns (TransactionReceiptTrie memory receipt)
    {
        RLPReader.Iterator memory it = RLPReader.toRlpItem(data).iterator();

        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) receipt.status = uint8(it.next().toUint());
            else if (idx == 1) receipt.gasUsed = it.next().toUint();
            else if (idx == 2) receipt.logsBloom = it.next().toBytes();
            else if (idx == 3) {
                RLPReader.RLPItem[] memory list = it.next().toList();
                receipt.logs = new Log[](list.length);
                for (uint256 i = 0; i < list.length; i++) {
                    receipt.logs[i] = toReceiptLog(list[i].toRlpBytes());
                }
            } else it.next();
            idx++;
        }
    }

    function getTransactionRaw(Transaction memory transaction, uint256 chainId)
        internal
        pure
        returns (bytes memory data)
    {
        bytes[] memory list = new bytes[](9);

        list[0] = RLPEncode.encodeUint(transaction.nonce);
        list[1] = RLPEncode.encodeUint(transaction.gasPrice);
        list[2] = RLPEncode.encodeUint(transaction.gas);
        list[3] = RLPEncode.encodeUint(transaction.shardID);
        list[4] = RLPEncode.encodeUint(transaction.toShardID);
        list[5] = RLPEncode.encodeAddress(transaction.to);
        list[6] = RLPEncode.encodeUint(transaction.value);
        list[7] = RLPEncode.encodeBytes(transaction.input);
        list[8] = RLPEncode.encodeUint(chainId);
        list[9] = RLPEncode.encodeUint(0);
        list[10] = RLPEncode.encodeUint(0);
        data = RLPEncode.encodeList(list);
    }

    /**
     * @param rlpTx: RLP-encoded tx with data fields order as defined in the Tx struct
     **/
    function toTransaction(bytes memory rlpTx)
        internal
        pure
        returns (Transaction memory transaction)
    {
        RLPReader.Iterator memory it = rlpTx.toRlpItem().iterator();
        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) transaction.nonce = it.next().toUint();
            else if (idx == 1) transaction.gasPrice = it.next().toUint();
            else if (idx == 2) transaction.gas = it.next().toUint();
            else if (idx == 3) transaction.shardID = it.next().toUint();
            else if (idx == 4) transaction.toShardID = it.next().toUint();
            else if (idx == 5) transaction.to = it.next().toAddress();
            else if (idx == 6) transaction.value = it.next().toUint();
            else if (idx == 7) transaction.input = it.next().toBytes();
            else if (idx == 8) transaction.v = uint8(it.next().toUint());
            else if (idx == 9) transaction.r = it.next().toBytes32();
            else if (idx == 10) transaction.s = it.next().toBytes32();
            else it.next();
            idx++;
        }
        return transaction;
    }

    function toAccount(bytes memory data)
        internal
        pure
        returns (Account memory account)
    {
        RLPReader.Iterator memory it = RLPReader.toRlpItem(data).iterator();

        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) account.nonce = it.next().toUint();
            else if (idx == 1) account.balance = it.next().toUint();
            else if (idx == 2)
                account.storageRoot = toBytes32(it.next().toBytes());
            else if (idx == 3)
                account.codeHash = toBytes32(it.next().toBytes());
            else it.next();
            idx++;
        }
    }

    function toBytes32(bytes memory data)
        internal
        pure
        returns (bytes32 _data)
    {
        assembly {
            _data := mload(add(data, 32))
        }
    }
}
