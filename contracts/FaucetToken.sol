// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FaucetToken is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public ERC20(name, symbol) {
        _setupDecimals(decimals);
    }

    function mint() public returns (bool) {
        uint256 UNIT = 10**uint256(decimals());
        _mint(msg.sender, 10000 * UNIT);
        return true;
    }
}
