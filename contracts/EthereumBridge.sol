// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7;
pragma experimental ABIEncoderV2;

import "./lib/RLPReader.sol";
import {IERC20} from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import {Ownable} from "openzeppelin-solidity/contracts/access/Ownable.sol";

contract EthereumBridge is Ownable {
    using RLPReader for RLPReader.RLPItem;
    using RLPReader for bytes;
    using SafeERC20 for IERC20;
}
