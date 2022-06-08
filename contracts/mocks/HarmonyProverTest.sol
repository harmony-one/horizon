// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "../HarmonyProver.sol";

contract HarmonyProverTest {
    function validateProof(bytes32 hashRoot, uint256 paths, bytes calldata proofs) external pure returns(bytes memory) {
        HarmonyProver.MerkleProof memory proof = HarmonyProver.MerkleProof(hashRoot, paths, proofs);
        return HarmonyProver.verifyTrieProof(proof);
    }

    function validateHeader(
        HarmonyParser.BlockHeader memory header,
        MMRVerifier.MMRProof memory proof
    ) external pure returns (bool valid, string memory reason) {
        return HarmonyProver.verifyHeader(header, proof);
    }
}
