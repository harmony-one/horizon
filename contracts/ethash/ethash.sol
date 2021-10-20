// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "./binary.sol";
import "./keccak512.sol";
import "./Prime.sol";
import "@openzeppelin/contracts-upgradeable/cryptography/MerkleProofUpgradeable.sol";

import "./MerkelRoot.sol"; // npm run merkelInit

contract Ethash is MerkelRoots {
    using LittleEndian for bytes;
    using Keccak512 for bytes;
    using Prime for uint256;

    uint32 constant hashWords = 16;
    uint32 constant hashBytes = 64;
    uint32 constant datasetParents = 256;
    uint32 constant mixBytes = 128; // Width of mix
    uint32 constant loopAccesses = 64; // Number of accesses in hashimoto loop
    uint256 constant MAX256 =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    uint256 constant DATASET_BYTES_INIT = 1073741824;
    uint256 constant DATASET_BYTES_GROWTH = 8388608; // 2 ^ 23
    uint256 constant EPOCH_LENGTH = 30000;

    function getFullSize(uint256 epoc) private pure returns (uint256) {
        uint256 sz = DATASET_BYTES_INIT + (DATASET_BYTES_GROWTH) * epoc;
        sz -= mixBytes;
        while (!(sz / mixBytes).probablyPrime(2)) {
            sz -= 2 * mixBytes;
        }
        return sz;
    }

    // fnv is an algorithm inspired by the FNV hash, which in some cases is used as
    // a non-associative substitute for XOR. Note that we multiply the prime with
    // the full 32-bit input, in contrast with the FNV-1 spec which multiplies the
    // prime with one byte (octet) in turn.
    function fnv(uint32 a, uint32 b) internal pure returns (uint32) {
        return (a * 0x01000193) ^ b;
    }

    // fnvHash mixes in data into mix using the ethash fnv method.
    function fnvHash32(uint32[] memory mix, uint32[] memory data)
        internal
        pure
    {
        assembly {
            let mixOffset := add(mix, 0x20)
            let mixValue := mload(mixOffset)
            let dataOffset := add(data, 0x20)
            let dataValue := mload(dataOffset)

            // fnv = return ((v1*0x01000193) ^ v2) & 0xFFFFFFFF;
            let fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 2
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 3
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 4
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 5
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 6
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 7
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 2
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 3
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 4
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 5
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 6
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 7
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)

            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)
            // ---- 1
            dataOffset := add(dataOffset, 0x20)
            dataValue := mload(dataOffset)
            mixOffset := add(mixOffset, 0x20)
            mixValue := mload(mixOffset)
            fnvValue := and(
                xor(mul(mixValue, 0x01000193), dataValue),
                0xFFFFFFFF
            )
            mstore(mixOffset, fnvValue)
        }
    }

    // hashimoto aggregates data from the full dataset in order to produce our final
    // value for a particular header hash and nonce.
    function hashimoto(
        bytes32 hash,
        uint64 nonce,
        uint64 size,
        bytes32[4][loopAccesses] memory cache,
        bytes32 rootHash,
        bytes32[][loopAccesses] memory proofs
    ) private pure returns (bytes32, bytes32) {
        // Calculate the number of theoretical rows (we use one buffer nonetheless)
        uint32 rows = uint32(size / mixBytes);

        // Combine header+nonce into a 64 byte seed
        bytes memory seed = new bytes(40);
        seed.copyBytes32(0, hash);
        seed.PutUint64(32, nonce);

        seed = seed.sha3_512();
        uint32 seedHead = seed.Uint32(0);

        // Start the mix with replicated seed
        uint32[] memory mix = new uint32[](mixBytes / 4);
        for (uint32 i = 0; i < mix.length; i++) {
            mix[i] = seed.Uint32((i % 16) * 4);
        }
        // Mix in random dataset nodes
        uint32[] memory temp = new uint32[](mix.length);

        bytes32 root = rootHash;
        for (uint32 i = 0; i < loopAccesses; i++) {
            uint32 parent = fnv(i ^ seedHead, mix[i % mix.length]) % rows;
            //bytes32[4] memory dag = cache[2*parent];
            bytes32[4] memory dag = cache[i];
            uint256 dagIndex = 2 * parent;
            bytes32[] memory proof = proofs[i];
            bytes32 leafHash = keccak256(abi.encodePacked(dagIndex, dag));
            MerkleProofUpgradeable.verify(proof, root, leafHash);
            for (uint32 j = 0; j < dag.length; j++) {
                uint32 k = j * 8;
                uint256 data = uint256(dag[j]);
                temp[k] = LittleEndian.reverse(uint32(data >> (7 * 32)));
                temp[k + 1] = LittleEndian.reverse(uint32(data >> (6 * 32)));
                temp[k + 2] = LittleEndian.reverse(uint32(data >> (5 * 32)));
                temp[k + 3] = LittleEndian.reverse(uint32(data >> (4 * 32)));
                temp[k + 4] = LittleEndian.reverse(uint32(data >> (3 * 32)));
                temp[k + 5] = LittleEndian.reverse(uint32(data >> (2 * 32)));
                temp[k + 6] = LittleEndian.reverse(uint32(data >> (1 * 32)));
                temp[k + 7] = LittleEndian.reverse(uint32(data >> (0 * 32)));
            }
            fnvHash32(mix, temp);
        }

        // Compress mix
        for (uint32 i = 0; i < mix.length; i += 4) {
            mix[i / 4] = fnv(
                fnv(fnv(mix[i], mix[i + 1]), mix[i + 2]),
                mix[i + 3]
            );
        }
        //mix = mix[:len(mix)/4];
        uint256 digest = 0;
        for (uint32 i = 0; i < mix.length / 4; i++) {
            //binary.LittleEndian.PutUint32(digest[i*4:], val)
            digest <<= 32;
            uint32 val = mix[i];
            digest |= uint256(
                ((val & 0xff) << 24) |
                    (((val >> 8) & 0xff) << 16) |
                    (((val >> 16) & 0xff) << 8) |
                    (val >> 24)
            );
        }
        return (bytes32(digest), keccak256(abi.encodePacked(seed, digest)));
    }

    function verifyEthash(
        bytes32 hash,
        uint64 nonce,
        uint64 number,
        bytes32[4][loopAccesses] memory cache,
        bytes32[][loopAccesses] memory proofs,
        uint256 difficulty,
        uint256 mixHash
    ) public pure returns (bool) {
        uint256 epoch = number / EPOCH_LENGTH;
        bytes32 rootHash = getRootHash(uint64(epoch));
        uint256 size = getFullSize(epoch);
        (bytes32 mix, bytes32 _diff) = hashimoto(
            hash,
            nonce,
            uint64(size),
            cache,
            rootHash,
            proofs
        );
        uint256 target = MAX256 / difficulty; // target = (2**256)/difficult;
        target += ((MAX256 % difficulty) + 1) / difficulty;
        return
            mix == bytes32(mixHash) &&
            difficulty > 1 &&
            target > uint256(_diff);
    }
}
