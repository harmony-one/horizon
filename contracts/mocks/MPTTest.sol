// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "../lib/MPT.sol";
import "../lib/MPTValidatorV2.sol";
import "../EthereumProver.sol";

contract MPTTest {
    using MPT for MPT.MerkleProof;

    function verifyTrieProof(
        bytes32 rootHash,
        bytes memory key,
        bytes[] memory proof,
        bytes memory expectedValue
    ) external pure returns (bool) {
        MPT.MerkleProof memory mp = MPT.MerkleProof({
            expectedRoot: rootHash,
            key: key,
            proof: proof,
            keyIndex: 0,
            proofIndex: 0,
            expectedValue: expectedValue
        });
        return mp.verifyTrieProof();
    }

    function validateMPTProof(
        bytes32 rootHash,
        bytes calldata mptKey,
        bytes calldata proof
    ) external pure returns (bytes memory value) {
        return EthereumProver.validateMPTProof(rootHash, mptKey, proof);
    }

    function validateProofOptimize(bytes32 hashRoot, uint256 paths, bytes calldata proofs) external pure returns(bytes memory) {
        return MPTValidatorV2.validateProofOptimize(hashRoot, paths, proofs);
    }

    function validateProof(bytes32 hashRoot, bytes calldata paths, bytes[] memory proof) external pure returns(bytes memory) {
        return MPTValidatorV2.validateProof(hashRoot, paths, proof);
    }
}
