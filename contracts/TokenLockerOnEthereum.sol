// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./HarmonyLightClient.sol";
import "./lib/MMRVerifier.sol";
import "./HarmonyProver.sol";
import "./TokenLocker.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract TokenLockerOnEthereum is TokenLocker, OwnableUpgradeable {
    HarmonyLightClient public lightclient;

    mapping(bytes32 => bool) public spentReceipt;

    function initialize() external initializer {
        __Ownable_init();
    }

    function changeLightClient(HarmonyLightClient newClient)
        external
        onlyOwner
    {
        lightclient = newClient;
    }

    function bind(address otherSide) external onlyOwner {
        otherSideBridge = otherSide;
    }

    function validateAndExecuteProof(
        HarmonyParser.BlockHeader memory header,
        MMRVerifier.MMRProof memory mmrProof,
        HarmonyProver.MerkleProof memory receiptdata
    ) external {
        require(lightclient.isValidCheckPoint(header.epoch, mmrProof.root), "checkpoint validation failed");
        bytes32 blockHash = HarmonyParser.getBlockHash(header);
        bytes32 rootHash = header.receiptsRoot;
        (bool status, string memory message) = HarmonyProver.verifyHeader(
            header,
            mmrProof
        );
        require(rootHash == receiptdata.root, "invalid proof root");
        require(status, "block header could not be verified");
        bytes32 receiptHash = keccak256(
            abi.encodePacked(blockHash, rootHash, receiptdata.paths)
        );
        require(spentReceipt[receiptHash] == false, "double spent!");
        spentReceipt[receiptHash] = true;
        bytes memory receipt = HarmonyProver.verifyReceipt(header, receiptdata);
        uint256 executedEvents = execute(receipt);
        require(executedEvents > 0, "no valid event");
    }
}
