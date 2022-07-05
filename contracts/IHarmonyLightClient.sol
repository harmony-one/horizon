// SPDX-License-Identifier: UNLICENSED

// OpenZeppelin Contracts (last updated v4.6.0) (token/ERC721/IERC721.sol)

pragma solidity ^0.8.0;

interface IHarmonyLightClient {

    function isValidCheckPoint(uint256 epoch, bytes32 mmrRoot) external view returns (bool status);

}