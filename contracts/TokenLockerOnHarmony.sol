// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./EthereumLightClient.sol";
import "./EthereumProver.sol";
import "./TokenLocker.sol";

contract TokenLockerOnHarmony is TokenLocker, Ownable {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    EthereumLightClient public lightclient;

    mapping(bytes32 => bool) public spentReceipt;

    function changeLightClient(EthereumLightClient newClient)
        external
        onlyOwner
    {
        lightclient = newClient;
    }

    function bind(address otherSide) external onlyOwner {
        otherSideBridge = otherSide;
    }

    function validateAndExecuteProof(
        uint256 blockNo,
        bytes32 rootHash,
        bytes calldata mptkey,
        bytes calldata proof
    ) external {
        bytes32 blockHash = bytes32(lightclient.blocksByHeight(blockNo, 0));
        require(
            lightclient.VerifyReceiptsHash(blockHash, rootHash),
            "wrong receipt hash"
        );
        bytes32 receiptHash = keccak256(
            abi.encodePacked(blockHash, rootHash, mptkey)
        );
        require(spentReceipt[receiptHash] == false, "double spent!");
        bytes memory rlpdata = EthereumProver.validateMPTProof(
            rootHash,
            mptkey,
            proof
        );
        spentReceipt[receiptHash] = true;
        uint256 executedEvents = execute(rlpdata);
        require(executedEvents > 0, "no valid event");
    }
}
