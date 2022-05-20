// SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./RLPReader.sol";

library MPTValidatorV2 {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for RLPReader.Iterator;

    function validateProofOptimize(bytes32 hashRoot, uint256 paths, bytes memory proofs) internal pure returns(bytes memory) {
        RLPReader.RLPItem memory item = RLPReader.toRlpItem(proofs);
        RLPReader.Iterator memory iterator = item.iterator();
        uint numItems = item.numItems();
        for (uint i = 0; i < numItems; i++) {
            item = iterator.next();
            uint index = uint8(paths);
            paths>>=8;
            require(hashRoot == item.toRlpBytesHash(), "ProofLib: invalid hashlink");
            item = item.safeGetItemByIndex(index);
            if (i < numItems - 1)
                hashRoot = bytes32(item.toUint());
        }
        require(paths == 0, "invalid path");
        return item.toBytes();
    }

    function validateProof(bytes32 hashRoot, bytes memory paths, bytes[] memory proof) internal pure returns(bytes memory) {
        require(paths.length == proof.length, "ProofLib: invalid proof size");

        RLPReader.RLPItem memory item;
        bytes memory proofBytes;

        for (uint i = 0; i < proof.length; i++) {
            proofBytes = proof[i];
            uint index = uint8(paths[i]);
            require(hashRoot == keccak256(proofBytes), "ProofLib: invalid hashlink");
            
            item = RLPReader.toRlpItem(proofBytes);
            if (item.numItems() == 2) index = 1;
            item = item.safeGetItemByIndex(index);
            if (i < proof.length - 1) hashRoot = bytes32(item.toUint());
        }
        return item.toBytes();
    }
}
