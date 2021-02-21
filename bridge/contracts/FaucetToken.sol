pragma solidity ^0.6.2;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

contract FaucetToken is ERC20Burnable {
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20(name,symbol) public{
        _setupDecimals(decimals);
    }
    function mint() public returns (bool) {
        _mint(msg.sender, 10000);
        return true;
    }
}