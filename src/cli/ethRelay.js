const ElcABI = require('../../build/contracts/EthereumLightClient.sol/EthereumLightClient.json')
const {
    getBlockByNumber,
    getHeaderProof
} = require('../ethashProof/BlockProof')
const { EthEthers } = require('../lib/ethEthers')
const Ethers = require('ethers')
const { Logger } = require('../lib/logger.js')

async function blockRelay (dagPath, ethUrl, ethEthers, elcAddress) {
    const elc = ethEthers.ContractAt(elcAddress, ElcABI.abi)
    const lastBlockNo = await elc.getBlockHeightMax()
    Logger.debug('ELC last block number:', lastBlockNo)
    const blockRelay = Number(lastBlockNo) + 1
    Logger.debug('block to relay:', blockRelay)
    const header = await getBlockByNumber(ethUrl, blockRelay)
    Logger.debug(`header: ${JSON.stringify(header)}`)
    Logger.debug('header hash', Ethers.utils.keccak256(header.serialize()))
    const proofs = getHeaderProof(dagPath, header)
    Logger.debug(`proofs.root: ${proofs.root}`)
    const rlpHeader = header.serialize()
    await elc.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs)
    const blockNo = await elc.getBlockHeightMax()
    console.log('new block number:', blockNo.toString())
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function blockRelayLoop (dagPath, ethUrl, hmyUrl, elcAddress) {
    const ethEthers = new EthEthers(hmyUrl)
    while (1) {
        try {
            blockRelay(dagPath, ethUrl, ethEthers, elcAddress)
        } catch (e) {
            console.error(e)
        }
        await sleep(10000)
    }
}

module.exports = {
    blockRelayLoop
}
