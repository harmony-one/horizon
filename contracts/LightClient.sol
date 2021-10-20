// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/access/Ownable.sol";

interface ILightClient {
    function blocksByHeight(uint256, uint256) external returns (uint256); // block number => block hash[]

    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash)
        external
        returns (bool);
}

contract LightClientFake is ILightClient {
    function blocksByHeight(uint256 number, uint256)
        external
        override
        returns (uint256)
    {
        return uint256(keccak256(abi.encode(number)));
    }

    function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash)
        external
        override
        returns (bool)
    {
        blockHash;
        receiptsHash;
        return true;
    }
}
