const { Bridge } = require('./bridge')
const { EthEthers } = require('../lib/ethEthers.js')
const HmyLockerSol = require('../../build/contracts/TokenLockerOnHarmony.sol/TokenLockerOnHarmony.json')
const { EProver } = require('../eprover')
const { Logger } = require('../lib/logger.js')

class HmyBridge extends Bridge {
    constructor (rpcUrl, bridgeAddress) {
        const ethers = new EthEthers(rpcUrl)
        const tokenLocker = ethers.ContractAt(bridgeAddress, HmyLockerSol.abi)
        Logger.debug(`HmyBridge rpcURL: ${rpcUrl}`)
        Logger.debug(`HmyBridge bridgeAddress: ${bridgeAddress}`)
        Logger.debug(`HmyBridge tokenLocker.address: ${tokenLocker.address}`)
        Logger.debug(`HmyBridge Dummy spentReceipt: ${JSON.stringify(tokenLocker.spentReceipt('0xad256388a630390461ba53284a0e095bbc5c54021b622d8f9fc117c6d604eb94'))}`)
        // Logger.debug(`HmyBridge bind code: ${tokenLocker.bind}`)
        // const hprove = null; // TODO
        const hprover = new EProver(rpcUrl) // TODO

        super(ethers, tokenLocker, hprover)
    }
}

module.exports = {
    HmyBridge
}
