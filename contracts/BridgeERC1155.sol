// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BridgeERC1155 is
    ERC1155BurnableUpgradeable,
    OwnableUpgradeable
{

    mapping(uint256 => string) tokenURIs;

    function initialize() external initializer {
        __ERC1155_init("None");
        __Ownable_init();
    }

    function mint(address to, uint256 tokenId, uint256 amount, string memory uri) external onlyOwner {
        _mint(to, tokenId, amount, "");
        _setTokenURI(tokenId, uri);
    }

    function _setTokenURI(uint256 tokenId, string memory uri) internal{
        tokenURIs[tokenId] = uri;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        //_requireMinted(tokenId);
        return tokenURIs[tokenId];
    }
}
