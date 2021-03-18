pragma solidity ^0.6.2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract FaucetToken is ERC20 {
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name,symbol) public{
        _setupDecimals(decimals);
    }
    function mint() public returns (bool) {
        uint256 UNIT = 10**uint256(decimals());
        _mint(msg.sender, 10000*UNIT);
        return true;
    }
}