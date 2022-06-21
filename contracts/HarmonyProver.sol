// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

// largely based on
// https://github.com/loredanacirstea/goldengate/blob/master/contracts/contracts/Prover.sol

import "./HarmonyParser.sol";
import "./HarmonyLightClient.sol";
import "./lib/MMRVerifier.sol";
import "./lib/ECVerify.sol";
import "./lib/MPTValidatorV2.sol";

library HarmonyProver {
    using HarmonyProver for MerkleProof;

    struct MerkleProof {
        bytes32 root;
        uint256 paths;
        bytes proof;
    }

    function verifyTrieProof(MerkleProof memory data)
        internal
        pure
        returns (bytes memory)
    {
        return MPTValidatorV2.validateProof(data.root, data.paths, data.proof);
    }

    function verifyHeader(
        HarmonyParser.BlockHeader memory header,
        MMRVerifier.MMRProof memory proof
    ) internal pure returns (bool valid, string memory reason) {
        bytes32 blockHash = HarmonyParser.getBlockHash(header);
        if (blockHash != header.hash)
            return (false, "Header data or hash invalid");

        // Check block hash was registered in light client
        valid = MMRVerifier.inclusionProof(
            proof.root,
            proof.width,
            proof.index,
            blockHash,
            proof.peaks,
            proof.siblings
        );
        if (!valid) return (false, "verifyHeader - invalid proof");

        return (true, "");
    }

    function verifyTransaction(
        HarmonyParser.BlockHeader memory header,
        MerkleProof memory txdata
    ) internal pure returns (bytes memory serializedTx) {
        require(header.transactionsRoot == txdata.root, "verifyTransaction - different trie roots");
        return txdata.verifyTrieProof();
    }

    function verifyReceipt(
        HarmonyParser.BlockHeader memory header,
        MerkleProof memory receiptdata
    ) internal pure returns (bytes memory serializedReceipt) {
        require(header.receiptsRoot == receiptdata.root, "verifyReceipt - different trie roots");
        return receiptdata.verifyTrieProof();
    }

    function verifyAccount(
        HarmonyParser.BlockHeader memory header,
        MerkleProof memory accountdata
    ) internal pure returns (bytes memory serializedAccount) {
        require(header.stateRoot == accountdata.root, "verifyAccount - different trie roots");
        return accountdata.verifyTrieProof();
    }

    function verifyLog(
        MerkleProof memory receiptdata,
        uint256 logIndex
    ) internal pure returns (bytes memory logdata) {
        bytes memory serializedReceipt = receiptdata.verifyTrieProof();
        HarmonyParser.TransactionReceiptTrie memory receipt = HarmonyParser
            .toReceipt(serializedReceipt);
        return HarmonyParser.getLog(receipt.logs[logIndex]);
    }

    function verifyTransactionAndStatus(
        HarmonyParser.BlockHeader memory header,
        MerkleProof memory receiptdata
    ) internal pure returns (bool valid, string memory reason) {}

    function verifyCode(
        HarmonyParser.BlockHeader memory header,
        MerkleProof memory accountdata
    ) internal pure returns (bool valid, string memory reason) {}

    function verifyStorage(
        MerkleProof memory accountProof,
        MerkleProof memory storageProof
    ) internal pure returns (bytes memory data) {
        HarmonyParser.Account memory account = HarmonyParser.toAccount(
            accountProof.verifyTrieProof()
        );
        require(account.storageRoot == storageProof.root, "verifyStorage - different trie roots");
        return storageProof.verifyTrieProof();
    }

    function getTransactionSender(
        bytes memory txdata,
        uint256 chainId
    ) internal pure returns (address sender) {
        HarmonyParser.Transaction memory transaction = HarmonyParser
            .toTransaction(txdata);
        bytes memory txraw = HarmonyParser.getTransactionRaw(
            transaction,
            chainId
        );

        bytes32 message_hash = keccak256(txraw);
        sender = ECVerify.ecverify(
            message_hash,
            transaction.v,
            transaction.r,
            transaction.s
        );
    }

    function getTransactionHash(bytes memory signedTransaction)
        internal
        pure
        returns (bytes32 hash)
    {
        hash = keccak256(signedTransaction);
    }

    function getBlockHash(HarmonyParser.BlockHeader memory header)
        internal
        pure
        returns (bytes32 hash)
    {
        return keccak256(getBlockRlpData(header));
    }

    function getBlockRlpData(HarmonyParser.BlockHeader memory header)
        internal
        pure
        returns (bytes memory data)
    {
        return HarmonyParser.getBlockRlpData(header);
    }

    function toBlockHeader(bytes memory data)
        internal
        pure
        returns (HarmonyParser.BlockHeader memory header)
    {
        return HarmonyParser.toBlockHeader(data);
    }

    function getLog(HarmonyParser.Log memory log)
        internal
        pure
        returns (bytes memory data)
    {
        return HarmonyParser.getLog(log);
    }

    function getReceiptRlpData(
        HarmonyParser.TransactionReceiptTrie memory receipt
    ) internal pure returns (bytes memory data) {
        return HarmonyParser.getReceiptRlpData(receipt);
    }

    function toReceiptLog(bytes memory data)
        internal
        pure
        returns (HarmonyParser.Log memory log)
    {
        return HarmonyParser.toReceiptLog(data);
    }

    function toReceipt(bytes memory data)
        internal
        pure
        returns (HarmonyParser.TransactionReceiptTrie memory receipt)
    {
        return HarmonyParser.toReceipt(data);
    }

    function toTransaction(bytes memory data)
        internal
        pure
        returns (HarmonyParser.Transaction memory transaction)
    {
        return HarmonyParser.toTransaction(data);
    }

    function toAccount(bytes memory data)
        internal
        pure
        returns (HarmonyParser.Account memory account)
    {
        return HarmonyParser.toAccount(data);
    }
}
