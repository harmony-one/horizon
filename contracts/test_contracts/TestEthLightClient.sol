// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "../EthereumLightClient.sol";

/// @title Ethereum light client
contract TesterEthLightClient is EthereumLightClient {
    using SafeMathUpgradeable for uint256;




    function dummmyAddBlockHeader(
        uint256[] calldata _headerParams,
        uint256 blockHash
    )
        external
        returns (bool)
    {
        StoredBlockHeader memory storedBlock = StoredBlockHeader({
            parentHash: _headerParams[0],
            stateRoot: _headerParams[1],
            transactionsRoot: _headerParams[2],
            receiptsRoot: _headerParams[3],
            number: _headerParams[4],
            difficulty: _headerParams[5],
            totalDifficulty : blocks[_headerParams[0]].difficulty.add(_headerParams[5]),
            time: _headerParams[6],
            hash: blockHash
        });

        blocks[blockHash] = storedBlock;
        blockExisting[blockHash] = true;
        // verifiedBlocks[blockHash] = true;

        blocksByHeight[storedBlock.number].push(blockHash);
        blocksByHeightExisting[storedBlock.number] = true;

        if (storedBlock.number > blockHeightMax) {
            blockHeightMax = storedBlock.number;
        }

        //Check if this block is ahead of the canonical head
        if(storedBlock.parentHash == canonicalHead){
            canonicalHead = blockHash;
            canonicalBlocks[blockHash] = true;
        }
        //Check if the canonical chain needs to be replaced by another fork
        else if(blocks[canonicalHead].totalDifficulty < blocks[blockHash].totalDifficulty){
            _updateCanonicalChain(blockHash);
        }

        return true;
    }




}