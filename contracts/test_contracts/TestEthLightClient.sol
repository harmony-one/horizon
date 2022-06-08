// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "../EthereumLightClient.sol";

/// @title Ethereum light client
contract TesterEthereumLightClient is EthereumLightClient {
    using SafeMathUpgradeable for uint256;

    function dummmyAddBlockHeader(
        uint256 parentHash,
        uint256 difficulty,
        uint256 blockHash
    ) external returns (bool) {
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash: parentHash,
            stateRoot: 0,
            transactionsRoot: 0,
            receiptsRoot: 0,
            number: 0,
            difficulty: difficulty,
            totalDifficulty: blocks[parentHash].totalDifficulty.add(difficulty),
            time: 0,
            hash: blockHash
        });

        blocks[blockHash] = storedBlock;
        blockExisting[blockHash] = true;
        // verifiedBlocks[blockHash] = true;

        //Check if this block is ahead of the canonical head
        if (parentHash == canonicalHead) {
            canonicalHead = blockHash;
            canonicalBlocks[blockHash] = true;
        }
        //Check if the canonical chain needs to be replaced by another fork
        else if (
            blocks[canonicalHead].totalDifficulty <
            blocks[blockHash].totalDifficulty
        ) {
            _updateCanonicalChain(blockHash);
        }

        return true;
    }
}
