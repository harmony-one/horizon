const Client = require('../../build/contracts/EthereumLightClient.sol/EthereumLightClient.json')
const { EthEthers } = require('../lib/ethEthers')
const { ethers } = require('ethers')

async function deployELC (hmyUrl, rlpHeader) {
    const hmyEthers = new EthEthers(hmyUrl)
    const elc = await hmyEthers.ContractDeploy(Client.abi, Client.bytecode, [rlpHeader])
    const gas = await elc.estimateGase.initialize(rlpHeader)
    const options = {
        gasLimit: gas.toNumber
    }
    await elc.initialize(rlpHeader, options)
    return elc
}

function printBlock (block) {
    const keys = Object.keys(block).filter((key) => isNaN(Number(key)))
    const blockFormat = {}
    keys.forEach((key) => {
        let value = block[key]
        // if (value.length > 64) value = '0x' + new BN(value).toString('hex')
        if (value.length > 64) value = '0x' + ethers.BigNumber.from(value).toHexString()
        blockFormat[key] = value
    })
    console.log(blockFormat)
}

async function statusELC (hmyUrl, elcAddress) {
    const hmyEthers = new EthEthers(hmyUrl)
    const elc = hmyEthers.ContractAt(Client.abi, elcAddress)
    const finalityConfirms = await elc.finalityConfirms()
    console.log('finalityConfirms:', finalityConfirms)
    const getBlockHeightMax = await elc.getBlockHeightMax()
    const lastBlockNo = await elc.blocksByHeight(getBlockHeightMax, 0)
    const lastBlock = await elc.blocks(lastBlockNo)
    console.log('last block:')
    printBlock(lastBlock)
    /*
      const firstBlockNo = await elcMethods.firstBlock().call();
      const firstBlock = await elcMethods.blocks(firstBlockNo).call();
      console.log('first block:')
      printBlock(firstBlock);
      */
}

module.exports = { deployELC, statusELC }
