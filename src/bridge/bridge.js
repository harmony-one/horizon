const { Logger } = require('../lib/logger.js')
const config = require('../../config.js')
const options = {
    gasLimit: config.gasLimit,
    gasPrice: config.gasPrice
}
class Bridge {
    constructor (ethers, tokenLocker, prover) {
        this.ethers = ethers
        this.tokenLocker = tokenLocker
        this.prover = prover
    }

    async getProof (txHash) {
        Logger.debug('getting Proof of Mapping Request')
        const tx = await this.prover.receiptProof(txHash, options)
        return tx
    }

    async ExecProof (proofData) {
        Logger.debug('In exec Proof')
        // Logger.debug(`proofData: ${JSON.stringify(proofData)}`)
        const { hash, root, key, proof } = proofData
        try {
        // const proofError = await this.tokenLocker.callStatic.validateAndExecuteProof(
        //     hash,
        //     root,
        //     key,
        //     proof,
        //     options
        // )
        // Logger.debug(`proofError: ${JSON.stringify(proofError)}`)
            const tx = await this.tokenLocker.validateAndExecuteProof(
                hash,
                root,
                key,
                proof,
                options
            )
            await tx.wait()
            Logger.debug('Leaving exec Proof')
            return tx
        } catch (error) {
            // const code = err.data.replace('Reverted ', '')
            console.log(`err: ${error}`)
            // const reason = this.ethers.utils.toUtf8String('0x' + code.substr(138))
            // console.log('revert reason:', reason)
        }
    }

    async Initialize () {
        const tx = await this.tokenLocker.initialize()
        await tx.wait()
        return tx
    }

    async Bind (tokenLockerAddress) {
        const tx = await this.tokenLocker.bind(tokenLockerAddress)
        await tx.wait()
        return tx
    }

    async ChangeLightClient (clientAddress) {
        const tx = await this.tokenLocker.changeLightClient(clientAddress)
        await tx.wait()
        return tx
    }

    async IssueTokenMapReq (token) {
        const tx = await this.tokenLocker.issueTokenMapReq(token)
        await this.ethers.provider.waitForTransaction(tx.hash)
        return tx
    }

    async Lock (token, to, amount) {
        const tx = await this.tokenLocker.lock(token, to, amount)
        await tx.wait()
        return tx
    }

    async Unlock (token, to, amount) {
        const tx = await this.tokenLocker.unlock(token, to, amount)
        await tx.wait()
        return tx
    }

    async TokenPair (token, isTx = true) {
        const method = isTx ? 'TxMapped' : 'RxMappedInv'
        const result = this.tokenLocker[method](token)
        const pair = [token, result]
        return isTx ? pair : pair.reverse()
    }

    // src: src Bridge
    // dest: dest Bridge
    // tx: tx hash on src chain
    static async CrossRelay (src, dest, tx) {
        const tx2 = await src.getProof(tx).then((proof) => dest.ExecProof(proof))
        await tx2.wait()
        return tx2
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    static async TokenMap (src, dest, token) {
        Logger.debug('In tokenLocker.js TokenMap')
        Logger.debug('======== Calling issueTokenMapReq ===========')
        const mapReq = await src.IssueTokenMapReq(token)
        Logger.debug('=========== Have mapReq ============')
        const mapAck = await Bridge.CrossRelay(src, dest, mapReq.hash)
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
        await tx.wait()
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
        await tx.wait()
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash)
    }
}

module.exports = { Bridge }
