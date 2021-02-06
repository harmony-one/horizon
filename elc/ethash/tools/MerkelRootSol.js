const fs = require('fs');
const yargs = require('yargs');

const argv = yargs
.option('in', {
    alias: 'i',
    description: 'merkel root json file',
    type: 'string',
    default: './MerkelRoot.json'
})
.option('out', {
    alias: 'o',
    description: 'output contract file',
    type: 'string',
    default: 'STDOUT'
}).env()
.help()
.alias('help', 'h').argv;

const merkelInfo = require(argv.in);

function toHex(str) {
    let hex = "";
    for(let i = 0; i < str.length; i+=2)
        hex += `\\x${str.slice(i, i+2)}`;
    return hex;
}

a=Buffer.alloc(0)
a.toString()

const MerkelRootSol = `
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

if(argv.out == 'STDOUT'){
    console.log(MerkelRootSol);
}
else{
    fs.writeFileSync(argv.out, MerkelRootSol);
}