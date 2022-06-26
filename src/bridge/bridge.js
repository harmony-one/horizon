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

    async getProof (transactionHash) {
        Logger.debug('getting Proof of Mapping Request')
        const tx = await this.prover.receiptProof(transactionHash, options)
        return tx
    }

    async ExecProofHmy (txReceipt, proofData) {
        Logger.debug('In exec Proof')
        // Logger.debug(`proofData: ${JSON.stringify(proofData)}`)
        // uint256 blockNo,
        // bytes32 rootHash,
        // uint256 proofPath,
        // bytes calldata proof
        // const { hash, root, key, proof } = proofData
        // const proofPath = txReceipt.blockNumber
        // try {
        // const proofError = await this.tokenLocker.callStatic.validateAndExecuteProof(
        // txReceipt.blockNumber, // blockno
        // txReceipt.transactionHash, // root,
        // txReceipt.blockNumber, // proofPath,
        // txReceipt.blockHash, // proof,
        // options
        // )
        // Logger.debug(`proofError: ${JSON.stringify(proofError)}`)
        const tx = await this.tokenLocker.validateAndExecuteProof(
            txReceipt.blockNumber, // blockno
            txReceipt.transactionHash, // root,
            txReceipt.blockNumber, // proofPath,
            txReceipt.blockHash, // proof,
            options
        )
        console.log(`ExecProofHmy tx: ${JSON.stringify(tx)}`)
        const txReceiptHmy = await tx.wait()
        Logger.debug('Leaving exec Proof')
        return txReceiptHmy
        // } catch (error) {
        //     // const code = err.data.replace('Reverted ', '')
        //     console.log(`err: ${error}`)
        //     // const reason = this.ethers.utils.toUtf8String('0x' + code.substr(138))
        //     // console.log('revert reason:', reason)
        // }
    }

    async ExecProofEth (proofData) {
        Logger.debug('In exec Proof')
        // Logger.debug(`proofData: ${JSON.stringify(proofData)}`)
        const { hash, root, key, proof } = proofData
        // try {
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
        // } catch (error) {
        //     // const code = err.data.replace('Reverted ', '')
        //     console.log(`err: ${error}`)
        //     // const reason = this.ethers.utils.toUtf8String('0x' + code.substr(138))
        //     // console.log('revert reason:', reason)
        // }
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
        const txReceipt = await this.ethers.provider.waitForTransaction(tx.hash)
        console.log(`IssueTokenMapReq txReceipt: ${JSON.stringify(txReceipt)}`)
        return txReceipt
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

    // ethBridge: src Bridge Ethereum
    // hmyBridge: dest Bridge Harmony
    // txReceipt: txReceipt on Ethereum
    static async CrossRelayEthHmy (ethBridge, hmyBridge, txReceipt) {
        // getProof of tx on Ethereum
        const ethProof = await ethBridge.getProof(txReceipt.transactionHash)
        Logger.debug(`txReceipt: ${JSON.stringify(txReceipt)}`)
        Logger.debug(`ethProof: ${JSON.stringify(ethProof)}`)
        // ExecProof of Transaction on Harmony
        const txHmyProof = await hmyBridge.ExecProofHmy(txReceipt, ethProof)
        console.log(`txHmyProof: ${JSON.stringify(txHmyProof)}`)

        // return the Harmony acknowledgement Transaction
        // const tx2 = await src.getProof(tx).then((proof) => dest.ExecProof(proof))
        // await tx2.wait()
        return txHmyProof
    }

    // src: src Bridge Harmony
    // dest: dest Bridge Ethereum
    // tx: tx hash on src chain
    static async CrossRelayHmyEth (src, dest, tx) {
        // getProof of tx on Harmony
        // ExecProof on Harmony
        // return the Ethereum Acknowledgement Transaction
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
        const mapAck = await Bridge.CrossRelayEthHmy(src, dest, mapReq)
        Logger.debug('=========== Have First Cross Relay ====')
        return Bridge.CrossRelayHmyEth(dest, src, mapAck.transactionHash)
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
