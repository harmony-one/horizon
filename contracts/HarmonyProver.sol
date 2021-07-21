// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

// largely based on
// https://github.com/loredanacirstea/goldengate/blob/master/contracts/contracts/Prover.sol

import "./HarmonyParser.sol";
import "./HarmonyLightClient.sol";
import "./lib/ECVerify.sol";
import "./lib/MPT.sol";

interface IHarmonyProver {
    function lightClient() view external returns (address _lightClient);

    function verifyTrieProof(MPT.MerkleProof memory data) pure external returns (bool);

    function verifyHeader(
        HarmonyParser.BlockHeader memory header
    ) view external returns (bool valid, string memory reason);

    function verifyTransaction(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory txdata
    ) view external returns (bool valid, string memory reason);

    function verifyReceipt(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory receiptdata
    ) view external returns (bool valid, string memory reason);

    function verifyAccount(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory accountdata
    ) view external returns (bool valid, string memory reason);

    function verifyLog(
        MPT.MerkleProof memory receiptdata,
        bytes memory logdata,
        uint256 logIndex
    ) view external returns (bool valid, string memory reason);

    function verifyTransactionAndStatus(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory receiptdata
    ) view external returns (bool valid, string memory reason);

    function verifyCode(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory accountdata
    ) view external returns (bool valid, string memory reason);

    function verifyStorage(
        MPT.MerkleProof memory accountProof,
        MPT.MerkleProof memory storageProof
    ) view external returns (bool valid, string memory reason);
}

contract HarmonyProver is IHarmonyProver {
    using MPT for MPT.MerkleProof;

    HarmonyLightClient public client;

    constructor(address lightClient) public {
        client = HarmonyLightClient(lightClient);
    }

    function lightClient() public view override returns (address _lightClient) {
        return address(client);
    }

    function verifyTrieProof(MPT.MerkleProof memory data)
        public
        pure
        override
        returns (bool)
    {
        return data.verifyTrieProof();
    }

    function verifyHeader(HarmonyParser.BlockHeader memory header)
        public
        view
        override
        returns (bool valid, string memory reason)
    {
        bytes32 blockHash = keccak256(getBlockRlpData(header));
        if (blockHash != header.hash)
            return (false, "Header data or hash invalid");

        // Check block hash was registered in light client
        bytes32 blockHashClient = client.getConfirmedBlockHash(header.number);
        if (blockHashClient != header.hash)
            return (false, "Unregistered block hash");

        return (true, "");
    }

    function verifyTransaction(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory txdata
    ) public pure override returns (bool valid, string memory reason) {
        if (header.transactionsRoot != txdata.expectedRoot)
            return (false, "verifyTransaction - different trie roots");

        valid = txdata.verifyTrieProof();
        if (!valid) return (false, "verifyTransaction - invalid proof");

        return (true, "");
    }

    function verifyReceipt(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory receiptdata
    ) public pure override returns (bool valid, string memory reason) {
        if (header.receiptsRoot != receiptdata.expectedRoot)
            return (false, "verifyReceipt - different trie roots");

        valid = receiptdata.verifyTrieProof();
        if (!valid) return (false, "verifyReceipt - invalid proof");

        return (true, "");
    }

    function verifyAccount(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory accountdata
    ) public pure override returns (bool valid, string memory reason) {
        if (header.stateRoot != accountdata.expectedRoot)
            return (false, "verifyAccount - different trie roots");

        valid = accountdata.verifyTrieProof();
        if (!valid) return (false, "verifyAccount - invalid proof");

        return (true, "");
    }

    function verifyLog(
        MPT.MerkleProof memory receiptdata,
        bytes memory logdata,
        uint256 logIndex
    ) public pure override returns (bool valid, string memory reason) {
        HarmonyParser.TransactionReceiptTrie memory receipt =
            HarmonyParser.toReceipt(receiptdata.expectedValue);

        if (
            keccak256(logdata) ==
            keccak256(HarmonyParser.getLog(receipt.logs[logIndex]))
        ) {
            return (true, "");
        }
        return (false, "Log not found");
    }

    function verifyTransactionAndStatus(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory receiptdata
    ) external pure override returns (bool valid, string memory reason) {}

    function verifyCode(
        HarmonyParser.BlockHeader memory header,
        MPT.MerkleProof memory accountdata
    ) public pure override returns (bool valid, string memory reason) {}

    function verifyStorage(
        MPT.MerkleProof memory accountProof,
        MPT.MerkleProof memory storageProof
    ) public pure override returns (bool valid, string memory reason) {
        HarmonyParser.Account memory account =
            HarmonyParser.toAccount(accountProof.expectedValue);

        if (account.storageRoot != storageProof.expectedRoot)
            return (false, "verifyStorage - different trie roots");

        valid = storageProof.verifyTrieProof();
        if (!valid) return (false, "verifyStorage - invalid proof");

        return (true, "");
    }

    function getTransactionSender(
        MPT.MerkleProof memory txdata,
        uint256 chainId
    ) public pure returns (address sender) {
        HarmonyParser.Transaction memory transaction =
            HarmonyParser.toTransaction(txdata.expectedValue);
        bytes memory txraw = HarmonyParser.getTransactionRaw(transaction, chainId);

        bytes32 message_hash = keccak256(txraw);
        sender = ECVerify.ecverify(
            message_hash,
            transaction.v,
            transaction.r,
            transaction.s
        );
    }

    function getTransactionHash(bytes memory signedTransaction)
        public
        pure
        returns (bytes32 hash)
    {
        hash = keccak256(signedTransaction);
    }

    function getBlockHash(HarmonyParser.BlockHeader memory header)
        public
        pure
        returns (bytes32 hash)
    {
        return keccak256(getBlockRlpData(header));
    }

    function getBlockRlpData(HarmonyParser.BlockHeader memory header)
        public
        pure
        returns (bytes memory data)
    {
        return HarmonyParser.getBlockRlpData(header);
    }

    function toBlockHeader(bytes memory data)
        public
        pure
        returns (HarmonyParser.BlockHeader memory header)
    {
        return HarmonyParser.toBlockHeader(data);
    }

    function getLog(HarmonyParser.Log memory log)
        public
        pure
        returns (bytes memory data)
    {
        return HarmonyParser.getLog(log);
    }

    function getReceiptRlpData(HarmonyParser.TransactionReceiptTrie memory receipt)
        public
        pure
        returns (bytes memory data)
    {
        return HarmonyParser.getReceiptRlpData(receipt);
    }

    function toReceiptLog(bytes memory data)
        public
        pure
        returns (HarmonyParser.Log memory log)
    {
        return HarmonyParser.toReceiptLog(data);
    }

    function toReceipt(bytes memory data)
        public
        pure
        returns (HarmonyParser.TransactionReceiptTrie memory receipt)
    {
        return HarmonyParser.toReceipt(data);
    }

    function toTransaction(bytes memory data)
        public
        pure
        returns (HarmonyParser.Transaction memory transaction)
    {
        return HarmonyParser.toTransaction(data);
    }

    function toAccount(bytes memory data)
        public
        pure
        returns (HarmonyParser.Account memory account)
    {
        return HarmonyParser.toAccount(data);
    }
}
