const Client = require("../../elc/build/contracts/Client.json");
const { HmyWeb3 } = require('../lib/hmyWeb3');
const { BN } = require('ethereumjs-util');

async function deployELC(hmyUrl, rlpHeader) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const tx = hmyWeb3.ContractDeploy(Client.abi, Client.bytecode, [rlpHeader]);
    return await hmyWeb3.sendTx(tx); //options.address
}

function printBlock(block) {
    const keys = Object.keys(block).filter(key=>isNaN(Number(key)));
    const blockFormat = {};
    keys.forEach(key=>{
        let value = block[key];
        if(value.length > 64) value = '0x'+(new BN(value)).toString('hex');
        blockFormat[key] = value;
    })
    console.log(blockFormat);
}

async function statusELC(hmyUrl, elcAddress) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const ELC = hmyWeb3.ContractAt(Client.abi, elcAddress);
    const elcMethods = ELC.methods;
    
    const finalityConfirms = await elcMethods.finalityConfirms().call();
    console.log('finalityConfirms:', finalityConfirms)
    const getBlockHeightMax = await elcMethods.getBlockHeightMax().call();
    const lastBlockNo = await elcMethods.blocksByHeight(getBlockHeightMax, 0).call();
    const lastBlock = await elcMethods.blocks(lastBlockNo).call();
    console.log('last block:')
    printBlock(lastBlock);
    /*
    const firstBlockNo = await elcMethods.firstBlock().call();
    const firstBlock = await elcMethods.blocks(firstBlockNo).call();
    console.log('first block:')
    printBlock(firstBlock);
    */
}


module.exports = {deployELC, statusELC};