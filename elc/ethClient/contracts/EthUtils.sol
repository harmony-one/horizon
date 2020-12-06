/**
 * Created on 2019-12-28
 * @summary: The EthUtils library contains utility functions
 * @author: Tuan Vu (tuanvd@gmail.com)
 */

pragma solidity ^0.5.0;

library EthUtils {
    function bytesToBytes32(bytes memory b, uint offset) internal pure returns (bytes32) {
        bytes32 out;

        for (uint i = 0; i < 32; i++) {
            out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    function hexStrToBytes(string memory _hexStr) internal pure returns (bytes memory)
    {
        //Check hex string is valid
        if (bytes(_hexStr)[0] != '0' ||
        bytes(_hexStr)[1] != 'x' ||
        bytes(_hexStr).length % 2 != 0 ||
        bytes(_hexStr).length < 4)
        {
            revert("hexStrToBytes: invalid input");
        }

        bytes memory bytes_array = new bytes((bytes(_hexStr).length - 2) / 2);

        for (uint i = 2; i < bytes(_hexStr).length; i += 2)
        {
            uint8 tetrad1 = 16;
            uint8 tetrad2 = 16;

            //left digit
            if (uint8(bytes(_hexStr)[i]) >= 48 && uint8(bytes(_hexStr)[i]) <= 57)
                tetrad1 = uint8(bytes(_hexStr)[i]) - 48;

            //right digit
            if (uint8(bytes(_hexStr)[i + 1]) >= 48 && uint8(bytes(_hexStr)[i + 1]) <= 57)
                tetrad2 = uint8(bytes(_hexStr)[i + 1]) - 48;

            //left A->F
            if (uint8(bytes(_hexStr)[i]) >= 65 && uint8(bytes(_hexStr)[i]) <= 70)
                tetrad1 = uint8(bytes(_hexStr)[i]) - 65 + 10;

            //right A->F
            if (uint8(bytes(_hexStr)[i + 1]) >= 65 && uint8(bytes(_hexStr)[i + 1]) <= 70)
                tetrad2 = uint8(bytes(_hexStr)[i + 1]) - 65 + 10;

            //left a->f
            if (uint8(bytes(_hexStr)[i]) >= 97 && uint8(bytes(_hexStr)[i]) <= 102)
                tetrad1 = uint8(bytes(_hexStr)[i]) - 97 + 10;

            //right a->f
            if (uint8(bytes(_hexStr)[i + 1]) >= 97 && uint8(bytes(_hexStr)[i + 1]) <= 102)
                tetrad2 = uint8(bytes(_hexStr)[i + 1]) - 97 + 10;

            //Check all symbols are allowed
            if (tetrad1 == 16 || tetrad2 == 16)
                revert("hexStrToBytes: invalid input");

            bytes_array[i / 2 - 1] = byte(16 * tetrad1 + tetrad2);
        }

        return bytes_array;
    }
}

