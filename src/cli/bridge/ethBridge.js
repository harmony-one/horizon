const { Bridge } = require('./bridge')
const { EthWeb3 } = require('../lib/ethWeb3')
const { EProver } = require('../../eprover')
const { Logger } = require('../../lib/logger.js')
const BridgeSol = require('../../../build/contracts/TokenLockerOnEthereum.sol/TokenLockerOnEthereum.json')

class EthBridge extends Bridge {
    constructor (rpcUrl, bridgeAddress) {
        const web3 = new EthWeb3(rpcUrl)
        const contract = web3.ContractAt(BridgeSol.abi, bridgeAddress)
        Logger.debug('Have ethBridge')
        const eprover = new EProver(rpcUrl) // TODO
        Logger.debug(`Have eprover: ${JSON.stringify(eprover)}`)
        super(web3, contract, eprover)
    }

    static async deploy (rpcUrl) {
        const web3 = new EthWeb3(rpcUrl)
        const tx = web3.ContractDeploy(BridgeSol.abi, BridgeSol.bytecode)
        const contract = await web3.sendTx(tx) // options.address or _address
        return new EthBridge(rpcUrl, contract._address)
    }
}

module.exports = {
    EthBridge
}
