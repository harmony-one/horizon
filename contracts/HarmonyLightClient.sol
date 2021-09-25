// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./HarmonyParser.sol";
import "./HarmonyLightClientStorage.sol";
import {SafeMath} from "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract HarmonyLightClient is HarmonyLightClientStorage {
    using SafeMath for uint256;

    struct MMRCheckPoint {
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 mmrRoot;
    }

    // epoch to block numbers
    mapping(uint256 => uint256[]) epochMmrBlockNumbers;

    // block number to MMRCheckPoint
    mapping(uint256 => MMRCheckPoint) blockMmmrCheckPoints;

    bytes public mmrRoot;
    bool public status;
    uint256 public blockHash;
    bytes32 public blockHash1;
    bytes public sig;

    constructor(bytes memory firstRlpHeader) public {
        uint256 blockHash = HarmonyParser.calcBlockHeaderHash(firstRlpHeader);
        HarmonyParser.BlockHeader memory header = HarmonyParser.toBlockHeader(
            firstRlpHeader
        );
    }

    function submitCheckpoint(
        bytes memory rlpHeader,
        bytes memory commitSig,
        bytes memory commitBitmap,
        bytes memory blockHashes
    ) public returns (bool status) {
        // bls verify the block header for quorum & signatures
        // epoch block
        // if (header.shardState.length > 0) {
        //     // store shard committees for the next epoch
        // }
        // append the blockHashes to MMR tree and check if the root matches the MMRRoot of the block header
        // current blockHash becomes the first node of new epoch MMR tree
    }

    function getLatestCheckPoint(uint256 blockNumber, uint256 epoch)
        public
        view
        returns (MMRCheckPoint memory mmrCheckPoint)
    {
        require(
            epochMmrBlockNumbers[epoch].length > 0,
            "no checkpoints for epoch"
        );
        uint256[] memory checkPointBlockNumbers = epochMmrBlockNumbers[epoch];
        uint256 nearest = 0;
        for (uint256 i = 0; i < checkPointBlockNumbers.length; i++) {
            uint256 checkPointBlockNumber = checkPointBlockNumbers[i];
            if (
                checkPointBlockNumber > blockNumber &&
                checkPointBlockNumber < nearest
            ) {
                nearest = checkPointBlockNumber;
            }
        }
        mmrCheckPoint = blockMmmrCheckPoints[nearest];
    }
}
