/**
 * Created on 2019-12-28
 * @summary: The EthCommon library contains common structures / functions
 * @author: Tuan Vu (tuanvd@gmail.com)
 */

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;

import "./lib/RLPReader.sol";
import "./lib/RLPEncode.sol";

library EthereumParser {
    using RLPReader for bytes;
    using RLPReader for uint256;
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;

    using RLPEncode for bytes;
    using RLPEncode for bytes[];

    struct BlockHeader {
        uint256 parentHash;
        uint256 sha3Uncles;
        address miner;
        uint256 stateRoot;
        uint256 transactionsRoot;
        uint256 receiptsRoot;
        bytes logsBloom;
        uint256 difficulty;
        uint256 number;
        uint256 gasLimit;
        uint256 gasUsed;
        uint256 timestamp;
        bytes extraData;
        uint256 mixHash;
        uint256 nonce;
        uint256 baseFeePerGas;
    }

    /**
     * Parse RLP-encoded block header into BlockHeader data structure
     *  @param _rlpHeader: RLP-encoded block header with data fields order as defined in the BlockHeader struct
     **/
    function parseBlockHeader(bytes memory _rlpHeader)
        internal
        pure
        returns (BlockHeader memory header)
    {
        RLPReader.Iterator memory it = _rlpHeader.toRlpItem().iterator();
        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) header.parentHash = it.next().toUint();
            else if (idx == 1) header.sha3Uncles = it.next().toUint();
            else if (idx == 2) header.miner = it.next().toAddress();
            else if (idx == 3) header.stateRoot = it.next().toUint();
            else if (idx == 4) header.transactionsRoot = it.next().toUint();
            else if (idx == 5) header.receiptsRoot = it.next().toUint();
            else if (idx == 6) header.logsBloom = it.next().toBytes();
            else if (idx == 7) header.difficulty = it.next().toUint();
            else if (idx == 8) header.number = it.next().toUint();
            else if (idx == 9) header.gasLimit = it.next().toUint();
            else if (idx == 10) header.gasUsed = it.next().toUint();
            else if (idx == 11) header.timestamp = it.next().toUint();
            else if (idx == 12) header.extraData = it.next().toBytes();
            else if (idx == 13) header.mixHash = it.next().toUint();
            else if (idx == 14) header.nonce = it.next().toUint();
            else if (idx == 15) header.baseFeePerGas = it.next().toUint();
            else it.next();

            idx++;
        }
        return header;
    }

    function calcBlockHeaderHash(bytes memory _rlpHeader)
        internal
        pure
        returns (uint256)
    {
        return uint256(keccak256(_rlpHeader));
    }

    function calcBlockSealHash(bytes memory _rlpHeader)
        internal
        pure
        returns (uint256)
    {
        bytes[] memory rlpFields = new bytes[](14);
        RLPReader.Iterator memory it = _rlpHeader.toRlpItem().iterator();
        uint256 idx = 0;
        while (it.hasNext() && idx < 14) {
            if (idx == 13) {
                it.next();
                it.next();
            }
            rlpFields[idx] = it.next().toRlpBytes();
            idx++;
        }

        bytes memory toSealRlpData = rlpFields.encodeList();
        return uint256(keccak256(toSealRlpData));
    }

    struct Transaction {
        uint256 nonce;
        uint256 gasPrice;
        uint256 gas;
        address to;
        uint256 value;
        bytes input;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /**
     * @param _rlpTx: RLP-encoded tx with data fields order as defined in the Tx struct
     **/
    function parseTx(bytes memory _rlpTx)
        internal
        pure
        returns (Transaction memory trans)
    {
        RLPReader.Iterator memory it = _rlpTx.toRlpItem().iterator();
        uint256 idx;
        while (it.hasNext()) {
            if (idx == 0) trans.nonce = it.next().toUint();
            else if (idx == 1) trans.gasPrice = it.next().toUint();
            else if (idx == 2) trans.gas = it.next().toUint();
            else if (idx == 3) trans.to = it.next().toAddress();
            else if (idx == 4) trans.value = it.next().toUint();
            else if (idx == 5) trans.input = it.next().toBytes();
            else if (idx == 6) trans.v = uint8(it.next().toUint());
            else if (idx == 7) trans.r = it.next().toBytes32();
            else if (idx == 8) trans.s = it.next().toBytes32();
            else it.next();
            idx++;
        }
        return trans;
    }
}
