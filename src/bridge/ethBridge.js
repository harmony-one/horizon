const { Bridge } = require('./bridge')
const { EthEthers } = require('../lib/ethEthers.js')
const { EProver } = require('../eprover')
const { Logger } = require('../lib/logger.js')
const EthLockerSol = require('../../build/contracts/TokenLockerOnEthereum.sol/TokenLockerOnEthereum.json')

class EthBridge extends Bridge {
    constructor (rpcUrl, bridgeAddress) {
        const ethers = new EthEthers(rpcUrl)
        const tokenLocker = ethers.ContractAt(bridgeAddress, EthLockerSol.abi)
        Logger.debug(`Have ethBridge: ${rpcUrl}`)
        const eprover = new EProver(rpcUrl) // TODO
        Logger.debug(`Have eprover: ${JSON.stringify(eprover)}`)
        super(ethers, tokenLocker, eprover)
    }
}

module.exports = {
    EthBridge
}
