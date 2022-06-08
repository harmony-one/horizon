// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "../lib/MPTValidatorV2.sol";

contract MPTTest {
    function validateProof(
        bytes32 hashRoot,
        uint256 paths,
        bytes calldata proofs
    ) external pure returns (bytes memory) {
        return MPTValidatorV2.validateProof(hashRoot, paths, proofs);
    }
}
