// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.7.3;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract FaucetToken is ERC20Upgradeable {
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) external initializer {
        __ERC20_init(name, symbol);
        _setupDecimals(decimals);
    }

    function mint() public returns (bool) {
        uint256 UNIT = 10**uint256(decimals());
        _mint(msg.sender, 10000 * UNIT);
        return true;
    }
}
