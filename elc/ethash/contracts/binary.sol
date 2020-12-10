pragma solidity ^0.6.2;

library LittleEndian {
    using LittleEndian for bytes;
    function PutUint32(bytes memory dst, uint32 offset, uint32 data) pure internal {
        dst[offset] = byte(uint8(data));
        dst[offset+1] = byte(uint8(data>>8));
        dst[offset+2] = byte(uint8(data>>16));
        dst[offset+3] = byte(uint8(data>>24));
    }
    function Uint32(bytes memory src, uint32 offset) pure internal returns(uint32) {
        return uint32(uint8(src[offset+3]))<<24 | uint32(uint8(src[offset+2]))<<16 | uint32(uint8(src[offset+1]))<<8 | uint32(uint8(src[offset]));
    }

    function PutUint64(bytes memory dst, uint32 offset, uint64 data) pure internal {
        dst.PutUint32(offset + 0, uint32(data));
        dst.PutUint32(offset + 4, uint32(data>>32));
    }

    function copyBytes32(bytes memory dst, uint32 offset, bytes32 data) pure internal {
        assembly {
            let memPtr := add(dst, add(offset,0x20))
            mstore(memPtr, data)
        }
    }
}