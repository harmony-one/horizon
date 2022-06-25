// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BridgeERC721 is
    ERC721BurnableUpgradeable,
    OwnableUpgradeable
{

    mapping(uint256 => string) tokenURIs;

    function initialize(
        string memory name,
        string memory symbol
    ) external initializer {
        __ERC721_init(name, symbol);
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) external{
        tokenURIs[tokenId] = uri;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        //_requireMinted(tokenId);
        return tokenURIs[tokenId];
    }
}
