const { ethers } = require('ethers')
const config = require('../../config.js')
const { Logger } = require('./logger.js')

class EthEthers {
    ethers
    address
    constructor (url, privateKey = config.privateKey) {
        this.provider = new ethers.providers.JsonRpcProvider(url)
        this.signer = new ethers.Wallet(privateKey, this.provider)
    }

    ContractAt (address, abi) {
        const contract = new ethers.Contract(address, abi, this.signer)
        return contract
    }

    async ContractDeploy (abi, bytecode, _arguments) {
        const factory = new ethers.ContractFactory(abi, bytecode, this.signer)
        const contract = await factory.deploy(_arguments)
        await contract.deployTransaction.wait()
        return contract
    }

    async sendTx (tx, gas) {
        if (!gas) {
            gas = await tx.estimateGas()
        }
        Logger.debug(`gas: ${JSON.stringify(gas)}`)
        return tx.send({ gasLimit: config.gasLimit })
        // return tx.send({ gas })
    }
}

module.exports = { EthEthers }
