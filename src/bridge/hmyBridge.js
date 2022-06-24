const { Bridge } = require('./bridge')
const { EthEthers } = require('../lib/ethEthers.js')
const HmyLockerSol = require('../../build/contracts/TokenLockerOnHarmony.sol/TokenLockerOnHarmony.json')
const { EProver } = require('../eprover')

class HmyBridge extends Bridge {
    constructor (rpcUrl, bridgeAddress) {
        const ethers = new EthEthers(rpcUrl)
        const tokenLocker = ethers.ContractAt(bridgeAddress, HmyLockerSol.abi)
        // const hprove = null; // TODO
        const hprover = new EProver(rpcUrl) // TODO

        super(ethers, tokenLocker, hprover)
    }
}

module.exports = {
    HmyBridge
}
