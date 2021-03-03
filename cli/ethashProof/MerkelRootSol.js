const fs = require('fs');

function toHex(str) {
    let hex = "";
    for(let i = 0; i < str.length; i+=2)
        hex += `\\x${str.slice(i, i+2)}`;
    return hex;
}

const merkelRootSol = merkelInfo=>`
pragma solidity ^0.6.2;

contract MerkelRoots {
    uint64 constant epochStart = ${merkelInfo.epoch};
    uint64 constant epochEnd = ${merkelInfo.epoch + merkelInfo.roots.length -1};
    bytes constant ROOTS = "${merkelInfo.roots.reduce((a,b)=>a+toHex(b), '')}";
    
   function getRootHash(uint64 epoch) internal pure returns(bytes32 hash) {
       bytes memory roots = ROOTS;
       require(epoch >= epochStart && epoch <= epochEnd, "epoch out of range!");
       uint256 index = epoch - epochStart + 1; // skip length
       assembly{
           hash := mload(add(roots, mul(index, 0x20)))
       }
   }
}`

module.exports = {
    merkelRootSol
}