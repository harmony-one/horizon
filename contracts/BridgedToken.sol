// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract BridgedToken is ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external initializer {
        __ERC20_init(name, symbol);
        __ERC20Burnable_init();
        _setupDecimals(decimals);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
