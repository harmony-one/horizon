require("dotenv").config({path: './envs/hmy.env'})
const { Harmony } = require("@harmony-js/core")
const { Account } = require('@harmony-js/account')
const { ChainID, ChainType } = require("@harmony-js/utils")
const tokenConfig = require("../tokenConfig.json")

const TokenMapReqEventSig = '0x78591F651C27EEF63481B7FD779E44C2426CBE82C7050FE9BC90B6707EFBC3D3'

class HmyBridge {
    constructor(bridgeAddress, tokenAddress) {
        let hmy = getHmy()
        let adminAccount = new Account(process.env.PRIVATE_KEY)
        let userAccount = new Account(process.env.PRIVATE_KEY_USER)

        let bridgeJson = require("../build/contracts/RainbowOnes.json")
        let tokenJson = require("../build/contracts/BridgedToken.json")

        this.hmy = hmy
        this.adminAccount = adminAccount
        this.userAccount = userAccount
        this.gasLimit = process.env.GAS_LIMIT
        this.gasPrice = process.env.GAS_PRICE
        this.bridgeJson = bridgeJson
        this.tokenJson = tokenJson

        if (bridgeAddress) {
            this.bridgeAddress = bridgeAddress
            this.bridgeContract = hmy.contracts.createContract(bridgeJson.abi, bridgeAddress)
        } else {
            this.bridgeContract = hmy.contracts.createContract(bridgeJson.abi)
        }

        if (tokenAddress) {
            this.tokenAddress = tokenAddress
            this.tokenContract = hmy.contracts.createContract(tokenJson.abi, tokenAddress)
        } else {
            this.tokenContract = hmy.contracts.createContract(tokenJson.abi)
        }

        this.proofNode = process.env.PROOF_NODE_URL
    }

    async deployBridge() {
        this.bridgeContract.wallet.setSigner(this.adminAccount.address)
        const deployOptions = {data: this.bridgeJson.bytecode}
        const options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}

        let response = await this.bridgeContract.methods.contractConstructor(deployOptions).send(options)

        const bridgeAddr = response.transaction.receipt.contractAddress
        this.bridgeAddress = bridgeAddr
        this.bridgeContract = this.hmy.contracts.createContract(this.bridgeJson.abi, bridgeAddr)
        console.log("Minter deployed on Harmony at", bridgeAddr)
        return bridgeAddr
    }

    addMintTokenContract(tokenAddress) {
        this.tokenAddress = tokenAddress
        this.tokenContract = this.hmy.contracts.createContract(this.tokenJson.abi, tokenAddress)
    }

    async getBalance(address) {
        this.tokenContract.wallet.setSigner(this.adminAccount.address)
        let options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}
        return await this.tokenContract.methods.balanceOf(address).call(options)
    }

    async addEthBridge(bridgeAddress) {
        this.bridgeContract.wallet.setSigner(this.adminAccount.address)
        let options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}
        return await this.bridgeContract.methods.bandBridgeSide(bridgeAddress).send(options)
    }

    async handleEthProof(proofData) {
        let hash = proofData.hash
        let root = proofData.root
        let key = proofData.key
        let proof = proofData.proof

        this.bridgeContract.wallet.setSigner(this.userAccount.address)
        let options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}
        let resp = await this.bridgeContract.methods.ExecProof(hash, root, key, proof).send(options)

        return resp.transaction.id
    }

    async getProof(txHash) {
        let data = {
            "jsonrpc": "2.0",
            "method": "hmy_getReceiptProof",
            "params": [
                txHash
            ],
            "id": 1
        }
        const options = {
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data),
            method: 'POST'
        }
        let resp = await fetch(this.proofNode, options)
        let respData = await resp.json()
        return {
            hash: hexToBuffer(respData.result.blockHash),
            root: hexToBuffer(respData.result.receiptRoot),
            key: hexToBuffer(respData.result.txIndex),
            proof: hexToBuffer(respData.result.receiptProof),
        }
    }

    async getNewTokenAddress(txHash) {
        let receipt = await this.hmy.blockchain.getTransactionReceipt({txnHash: txHash})
        for (let log of receipt.result.logs) {
            if (log.topics[0].toLowerCase() === TokenMapReqEventSig.toLowerCase()) {
                return topicToAddress(log.topics[log.topics.length - 1])
            }
        }
        return undefined
    }

    async approve(targetAddr, amount) {
        this.bridgeContract.wallet.setSigner(this.userAccount.address)
        let options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}
        return await this.tokenContract.methods.approve(targetAddr, amount).send(options)
    }

    async lock(ethAddr, amount) {
        this.bridgeContract.wallet.setSigner(this.userAccount.address)
        let options = {gasPrice: this.gasPrice, gasLimit: this.gasLimit}
        let resp = await this.bridgeContract.methods.RainbowBack(this.tokenAddress, ethAddr, amount).send(options)
        return resp.transaction.id
    }
}

function getHmy() {
    const hmy = new Harmony(process.env.HMY_NODE_URL, {
        chainType: ChainType.Harmony,
        chainId: ChainID.HmyTestnet,
    })

    hmy.wallet.addByPrivateKey(process.env.PRIVATE_KEY)
    hmy.wallet.addByPrivateKey(process.env.PRIVATE_KEY_USER)
    return hmy
}

function hexToBuffer(hexStr) {
    hexStr = hexStr.replace("0x", "")
    return Buffer.from(hexStr, 'hex')
}

function topicToAddress(topic) {
    topic = topic.replace('0x', '')
    topic = topic.replace(/^0+/, '');
    return '0x' + topic
}

module.exports = HmyBridge
