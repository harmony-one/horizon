pragma solidity ^0.6.2;

import {ERC20PresetMinterPauser} from "openzeppelin-solidity/contracts/presets/ERC20PresetMinterPauser.sol";

contract BridgedToken is ERC20PresetMinterPauser {
    constructor(string memory name, string memory symbol, uint8 decimals) ERC20PresetMinterPauser(name,symbol) public{
        _setupDecimals(decimals);
    }
}