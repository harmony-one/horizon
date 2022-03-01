pragma solidity ^0.7.3;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract WETH is ERC20Upgradeable{
    constructor() {
        _mint(msg.sender, 1000000000000000);
    } 

    function mint(uint256 amount) public {
        _mint(msg.sender, amount);
    }
}