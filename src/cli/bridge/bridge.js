// const { Console } = require('console')
// const { ethers } = require('ethers')
const config = require('../../../config.js')
const { Logger } = require('../../lib/logger.js')
// const options = {
//     gasLimit: config.gasLimit,
//     gasPrice: config.gasPrice
// }
class Bridge {
    // contract: bridge contract
    // prover: eprover/hprover
    constructor (web3, contract, prover) {
        this.web3 = web3
        this.contract = contract
        this.prover = prover
    }

    getProof (txHash) {
        Logger.debug('getting Proof of Mapping Request')
        // const tx = await this.prover.receiptProof(txHash)
        Logger.debug(`receiptProof Mapping Request: ${JSON.stringify(tx)}`)
        // return tx
        return this.prover.receiptProof(txHash)
    }

    async ExecProof (proofData) {
        Logger.debug('In exec Proof')
        const { hash, root, key, proof } = proofData
        const tx = this.contract.methods.validateAndExecuteProof(
            hash,
            root,
            key,
            proof
        )
        const txResult = await this.web3.sendTx(tx, config.gasLimit)
        Logger.debug('Have ExecProof Result')
        return txResult
        // return this.web3.sendTx(tx)
    }

    Initialize () {
        const tx = this.contract.methods.initialize()
        return this.web3.sendTx(tx)
    }

    Bind (bridgeAddress) {
        const tx = this.contract.methods.bind(bridgeAddress)
        return this.web3.sendTx(tx)
    }

    ChangeLightClient (clientAddress) {
        const tx = this.contract.methods.changeLightClient(clientAddress)
        return this.web3.sendTx(tx)
    }

    async IssueTokenMapReq (token) {
        Logger.debug('In IssueTokenMapReq')
        const tx = this.contract.methods.issueTokenMapReq(token)
        Logger.debug('Have prepared tx')
        const tx1 = await this.web3.sendTx(tx)
        Logger.debug(`tx1: ${JSON.stringify(tx1)}`)
        return tx1
        // return this.web3.sendTx(tx)
    }

    Lock (token, to, amount) {
        const tx = this.contract.methods.lock(token, to, amount)
        return this.web3.sendTx(tx)
    }

    Unlock (token, to, amount) {
        const tx = this.contract.methods.unlock(token, to, amount)
        return this.web3.sendTx(tx)
    }

    async TokenPair (token, isTx = true) {
        const method = isTx ? 'TxMapped' : 'RxMappedInv'
        const result = await this.contract.methods[method](token).call()
        const pair = [token, result]
        return isTx ? pair : pair.reverse()
    }

    // src: src Bridge
    // dest: dest Bridge
    // tx: tx hash on src chain
    static CrossRelay (src, dest, tx) {
        // return src.getProof(tx).then((proof) => dest.ExecProof(proof))
        return src.getProof(tx).then((proof) => dest.ExecProof(proof))
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    static async TokenMap (src, dest, token) {
        Logger.debug('In bridge.js TokenMap')
        Logger.debug('calling src.IssueTokenMapReq')
        Logger.debug(`token: ${token}`)
        // Logger.debug(`TxMapped: ${JSON.stringify(await src.contract.methods.TxMapped(token).call())}`)
        // Logger.debug(`src: ${JSON.stringify(src)}`)
        const mapReq = await src.IssueTokenMapReq(token)
        // Logger.debug(`Have mapReq: ${JSON.stringify(mapReq)}`)
        Logger.debug('Have mapReq')
        // wait light client
        const mapAck = await Bridge.CrossRelay(src, dest, mapReq.transactionHash)
        // Logger.debug(`Have mapAck: ${JSON.stringify(mapAck)}`)
        // wait light client
        Logger.debug('FinalBridgeCrossRelay')
        return Bridge.CrossRelay(dest, src, mapAck.transactionHash)
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenTo (src, dest, token, to, amount) {
        const tx = await src.Deposit(token, to, amount)
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash)
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenBack (src, dest, token, to, amount) {
        const tx = await src.Unlock(token, to, amount)
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash)
    }
}

module.exports = { Bridge }
