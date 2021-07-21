// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";
import {Ownable} from "openzeppelin-solidity/contracts/access/Ownable.sol";

contract BridgedToken is ERC20Burnable, Ownable {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals
    ) public ERC20(name, symbol) {
        _setupDecimals(decimals);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
