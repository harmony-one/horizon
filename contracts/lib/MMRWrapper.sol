// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;

import "./MMR.sol";
import "./RLPReader.sol";

contract MMRWrapper {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using MMR for MMR.Tree;

    MMR.Tree mTree;

    function append(bytes memory data) public {
        mTree.append(data);
    }

    function appendHash(bytes32 data) public {
        mTree.appendHash(data);
    }

    function getHash(uint256 index) public view returns (bytes32 result) {
        return mTree.hashOf(index);
    }

    function getRoot() public view returns (bytes32) {
        return mTree.getRoot();
    }

    function getSize() public view returns (uint256) {
        return mTree.getSize();
    }

    function getMerkleProof(uint256 index)
        public
        view
        returns (
            bytes32 root,
            uint256 width,
            bytes32[] memory peakBagging,
            bytes32[] memory siblings
        )
    {
        return mTree.getMerkleProof(index);
    }

    function deserialize(bytes memory rlpdata) public {
        RLPReader.RLPItem memory stacks = rlpdata.toRlpItem();
        RLPReader.RLPItem[] memory mmrHashes = stacks.toList();
        for (uint256 i = 0; i < mmrHashes.length; i++) {
            mTree.updateTree(bytes32(mmrHashes[i].toUint()));
        }
    }

    function addTree(bytes32[] memory itemHashes, uint256 width) public {
        for (uint256 i = 0; i < itemHashes.length; i++) {
            mTree.updateTree(itemHashes[i]);
        }
        mTree.updateRoot(width);
    }
}
