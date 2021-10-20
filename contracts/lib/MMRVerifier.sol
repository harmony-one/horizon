// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;

/**
 * @author Wanseob Lim <email@wanseob.com>
 * @title Merkle Mountain Range solidity library
 *
 * @dev The index of this MMR implementation starts from 1 not 0.
 *      And it uses keccak256 for its hash function instead of blake2b
 */
library MMRVerifier {
    struct MMRProof {
        bytes32 root;
        uint256 width;
        uint256 index;
        bytes32[] peaks;
        bytes32[] siblings;
    }
    
    /**
     * @dev It returns true when the given params verifies that the given value exists in the tree or reverts the transaction.
     */
    function inclusionProof(
        bytes32 root,
        uint256 width,
        uint256 index,
        bytes32 value32,
        bytes32[] memory peaks,
        bytes32[] memory siblings
    ) internal pure returns (bool) {
        // bytes32 value32;

        // assembly {
        //     value32 := mload(add(value, 32))
        // }
        uint256 size = getSize(width);
        require(size >= index, "Index is out of range");
        // Check the root equals the peak bagging hash
        require(
            root ==
                // keccak256(
                //     abi.encodePacked(
                //         size,
                //         keccak256(abi.encodePacked(size, peaks))
                //     )
                // ),
                keccak256(
                    abi.encodePacked(
                        peaks
                    )
                ),
            "Invalid root hash from the peaks"
        );

        // Find the mountain where the target index belongs to
        uint256 cursor;
        bytes32 targetPeak;
        uint256[] memory peakIndexes = getPeakIndexes(width);
        for (uint256 i = 0; i < peakIndexes.length; i++) {
            if (peakIndexes[i]-1 >= index) {
                targetPeak = peaks[i];
                cursor = peakIndexes[i]-1;
                break;
            }
        }
        require(targetPeak != bytes32(0), "Target is not found");

        // Find the path climbing down
        uint256[] memory path = new uint256[](siblings.length + 1);
        uint256 left;
        uint256 right;
        uint8 height = uint8(siblings.length) + 1;
        while (height > 0) {
            // Record the current cursor and climb down
            path[--height] = cursor;
            if (cursor == index) {
                // On the leaf node. Stop climbing down
                break;
            } else {
                // On the parent node. Go left or right
                (left, right) = getChildren(cursor+1);
                cursor = index > (left-1) ? (right-1) : (left-1);
                continue;
            }
        }

        // Calculate the summit hash climbing up again
        bytes32 node;
        while (height < path.length) {
            // Move cursor
            cursor = path[height];
            if (height == 0) {
                // cursor is on the leaf
                node = value32;//hashLeaf(cursor, keccak256(value));
            } else if (cursor - 1 == path[height - 1]) {
                // cursor is on a parent and a sibling is on the left
                node = hashBranch(siblings[height - 1], node);
            } else {
                // cursor is on a parent and a sibling is on the right
                node = hashBranch(node, siblings[height - 1]);
            }
            // Climb up
            height++;
        }

        // Computed hash value of the summit should equal to the target peak hash
        require(node == targetPeak, "Hashed peak is invalid");
        return true;
    }

    /**
     * @dev
     */
    function getSize(uint256 width) internal pure returns (uint256) {
        return (width << 1) - numOfPeaks(width);
    }

    /**
     * @dev It returns the hash a parent node with hash(M | Left child | Right child)
     *      M is the index of the node
     */
    function hashBranch(bytes32 left, bytes32 right)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(left, right));
    }

    /**
     * @dev it returns the hash of a leaf node with hash(M | DATA )
     *      M is the index of the node
     */
    function hashLeaf(uint256 index, bytes32 dataHash)
        internal
        pure
        returns (bytes32)
    {
        // return keccak256(abi.encodePacked(index, dataHash));
        return keccak256(abi.encodePacked(dataHash));
    }

    /**
     * @dev It returns the height of the highest peak
     */
    function mountainHeight(uint256 size) internal pure returns (uint8) {
        uint8 height = 1;
        while (uint256(1) << height <= size + height) {
            height++;
        }
        return height - 1;
    }

    /**
     * @dev It returns the height of the index
     */
    function heightAt(uint256 index) internal pure returns (uint8 height) {
        uint256 reducedIndex = index;
        uint256 peakIndex;
        // If an index has a left mountain subtract the mountain
        while (reducedIndex > peakIndex) {
            reducedIndex -= (uint256(1) << height) - 1;
            height = mountainHeight(reducedIndex);
            peakIndex = (uint256(1) << height) - 1;
        }
        // Index is on the right slope
        height = height - uint8((peakIndex - reducedIndex));
    }

    /**
     * @dev It returns the children when it is a parent node
     */
    function getChildren(uint256 index)
        internal
        pure
        returns (uint256 left, uint256 right)
    {
        left = index - (uint256(1) << (heightAt(index) - 1));
        right = index - 1;
        require(left != right, "Not a parent");
    }

    /**
     * @dev It returns all peaks of the smallest merkle mountain range tree which includes
     *      the given index(size)
     */
    function getPeakIndexes(uint256 width)
        internal
        pure
        returns (uint256[] memory peakIndexes)
    {
        peakIndexes = new uint256[](numOfPeaks(width));
        uint256 count;
        uint256 size;
        for (uint256 i = 255; i > 0; i--) {
            if (width & (1 << (i - 1)) != 0) {
                // peak exists
                size = size + (1 << i) - 1;
                peakIndexes[count++] = size;
            }
        }
        require(count == peakIndexes.length, "Invalid bit calculation");
    }

    function numOfPeaks(uint256 width) internal pure returns (uint256 num) {
        uint256 bits = width;
        while (bits > 0) {
            if (bits % 2 == 1) num++;
            bits = bits >> 1;
        }
        return num;
    }
}
