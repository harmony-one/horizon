// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "./EthereumLightClient.sol";
import "./lib/MPTValidatorV2.sol";
import "./TokenLocker.sol";

contract TokenLockerOnHarmony is TokenLocker, OwnableUpgradeable {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    EthereumLightClient public lightclient;

    mapping(bytes32 => bool) public spentReceipt;

    function initialize() external initializer {
        __Ownable_init();
    }

    function changeLightClient(EthereumLightClient newClient)
        external
        onlyOwner
    {
        lightclient = newClient;
    }

    function bind(address otherSide) external onlyOwner {
        otherSideBridge = otherSide;
    }

    function _validateEthTransaction(
        bytes32 blockHash,
        bytes32 rootHash,
        uint256 proofPath,
        bytes calldata proof
    )
        internal
        returns (bytes memory rlpdata)
    {
        require(
            lightclient.VerifyReceiptsHash(blockHash, rootHash),
            "wrong receipt hash"
        );
        rlpdata = MPTValidatorV2.validateProof(
            rootHash,
            proofPath,
            proof
        );
    }

    function validateAndExecuteProof(
        bytes32 blockHash,
        bytes32 rootHash,
        uint256 proofPath,
        bytes calldata proof
    ) external {
        bytes memory rlpdata = _validateEthTransaction(
            blockHash,
            rootHash,
            proofPath,
            proof
        );
        require(
            lightclient.isVerified(uint256(blockHash)),
            "Block not verified"
        );
        bytes32 receiptHash = keccak256(
            abi.encodePacked(blockHash, rootHash, proofPath)
        );
        require(spentReceipt[receiptHash] == false, "double spent!");
        spentReceipt[receiptHash] = true;
        uint256 executedEvents = execute(rlpdata);
        require(executedEvents > 0, "no valid event");
    }

    function userValidateAndExecuteProof(
        bytes32 blockHash,
        bytes32 rootHash,
        uint256 proofPath,
        bytes calldata proof,
        address targetAddress
    )
        external
    {
        bytes memory rlpdata = _validateEthTransaction(
            blockHash,
            rootHash,
            proofPath,
            proof
        );
        //Adding a parameter makes the concept of a "receiptHash" a little less valid, but no need to declare another mapping due to entropy of keccak256
        bytes32 receiptHash = keccak256(
            abi.encodePacked(blockHash, rootHash, proofPath, targetAddress)
        );
        require(spentReceipt[receiptHash] == false, "double spent!");
        spentReceipt[receiptHash] = true;
        uint256 executedEvents = userExecute(rlpdata, targetAddress);
        require(executedEvents > 0, "no valid event");
    }
}
