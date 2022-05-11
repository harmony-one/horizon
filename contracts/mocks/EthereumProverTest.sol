// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;

import "../EthereumProver.sol";

contract EthereumProverTest {
    function validateMPTProof(
        bytes32 rootHash,
        bytes calldata mptKey,
        bytes calldata proof
    ) external pure returns (bytes memory value) {
        return EthereumProver.validateMPTProof(rootHash, mptKey, proof);
    }
}