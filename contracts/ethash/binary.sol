// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

library LittleEndian {
    using LittleEndian for bytes;

    function reverse(uint32 num) internal pure returns (uint32) {
        return
            (num >> 24) |
            ((num >> 8) & 0xff00) |
            ((num << 8) & 0xff0000) |
            ((num << 24) & 0xff000000);
    }

    function PutUint32(
        bytes memory dst,
        uint32 offset,
        uint32 data
    ) internal pure {
        assembly {
            let memPtr := add(dst, add(offset, 0x20))
            mstore8(memPtr, data)
            mstore8(add(memPtr, 1), shr(8, data))
            mstore8(add(memPtr, 2), shr(16, data))
            mstore8(add(memPtr, 3), shr(24, data))
        }
        /*
        dst[offset] = byte(uint8(data));
        dst[offset+1] = byte(uint8(data>>8));
        dst[offset+2] = byte(uint8(data>>16));
        dst[offset+3] = byte(uint8(data>>24));*/
    }

    function Uint32(bytes memory src, uint32 offset)
        internal
        pure
        returns (uint32)
    {
        uint256 num;
        assembly {
            let memPtr := add(src, add(offset, 0x4)) // offset + 0x20 - (32-4)
            num := mload(memPtr)
        }
        return reverse(uint32(num));
        //return uint32(uint8(src[offset+3]))<<24 | uint32(uint8(src[offset+2]))<<16 | uint32(uint8(src[offset+1]))<<8 | uint32(uint8(src[offset]));
    }

    function PutUint64(
        bytes memory dst,
        uint32 offset,
        uint64 data
    ) internal pure {
        dst.PutUint32(offset + 0, uint32(data));
        dst.PutUint32(offset + 4, uint32(data >> 32));
    }

    function copyBytes32(
        bytes memory dst,
        uint32 offset,
        bytes32 data
    ) internal pure {
        assembly {
            let memPtr := add(dst, add(offset, 0x20))
            mstore(memPtr, data)
        }
    }
}
