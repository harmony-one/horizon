require("dotenv").config({path: './envs/eth.env'});
const Web3 = require("web3");
const BigNumber = require("bignumber.js")
const tokenConfig = require("../tokenConfig.json")
const { GetProof } = require('eth-proof');
const { toHex, toBuffer, encode } = require('eth-util-lite');

class EthBridge {
    constructor(tokenAddress, bridgeAddress) {
        const web3 = new Web3(process.env.ETH_NODE_URL)
        let adminAccount = web3.eth.accounts.privateKeyToAccount(process.env.ETH_ADMIN_PRIVATE_KEY)
        let userAccount = web3.eth.accounts.privateKeyToAccount(process.env.ETH_USER_PRIVATE_KEY)
        web3.eth.accounts.wallet.add(adminAccount);
        web3.eth.accounts.wallet.add(userAccount);
        web3.eth.defaultAccount = adminAccount.address;

        this.web3 = web3
        this.adminAccount = adminAccount
        this.userAccount = userAccount

        let tokenJson = require("../build/contracts/BridgedToken.json")
        if (tokenAddress) {
            this.tokenAddress = tokenAddress
            this.tokenContract = new web3.eth.Contract(tokenJson.abi, tokenAddress)
        } else {
            this.tokenContract = new web3.eth.Contract(tokenJson.abi)
        }
        this.tokenJson = tokenJson

        let bridgeJson = require("../build/contracts/RainbowOnes.json")
        if (bridgeAddress) {
            this.bridgeAddress = bridgeAddress
            this.bridgeContract = new web3.eth.Contract(bridgeJson.abi, bridgeAddress)
        } else {
            this.bridgeContract = new web3.eth.Contract(bridgeJson.abi)
        }
        this.bridgeJson = bridgeJson

        this.gp = new GetProof(process.env.ETH_NODE_URL)
    }

    async deployToken() {
        const gasPrice = await this._estimateGasPrice()
        const gasLimit = this._getGasLimit()
        const args = [ tokenConfig.tokenName, tokenConfig.symbol, tokenConfig.decimals ]
        const deployOptions = {data: this.tokenJson.bytecode, arguments: args}
        const sendOption = {from: this.adminAccount.address, gas: gasLimit, gasPrice: gasPrice}

        const txContract = await this.tokenContract.deploy(deployOptions).send(sendOption)

        const erc20 = `${txContract.options.address}`;
        this.tokenContract = new this.web3.eth.Contract(this.tokenJson.abi, erc20)
        this.tokenAddress = erc20
        console.log("Deployed ERC20 contract on Ethereum at", erc20);
        return erc20;
    }

    async deployBridge() {
        const gasPrice = await this._estimateGasPrice()
        const gasLimit = this._getGasLimit()
        const sendOption = {from: this.adminAccount.address, gas: gasLimit, gasPrice: gasPrice}
        const deployArgs = {data: this.bridgeJson.bytecode}

        const txContract = await this.bridgeContract.deploy(deployArgs).send(sendOption)

        const bridgeAddr = `${txContract.options.address}`
        this.bridgeContract = new this.web3.eth.Contract(this.bridgeJson.abi, bridgeAddr)
        this.bridgeAddress = bridgeAddr
        console.log("Deployed bridge contract on Ethereum at", bridgeAddr)
        return bridgeAddr
    }

    async getBalance(addr) {
        const sendOption = await this._getUserOption()
        return await this.tokenContract.methods.balanceOf(addr).call(sendOption)
    }

    async addHarmonyBridge(bridgeAddress) {
        const sendOption = await this._getAdminOption()
        return await this.bridgeContract.methods.bandBridgeSide(bridgeAddress).send(sendOption)
    }

    async addToken(tokenAddress) {
        const sendOption = await this._getUserOption()
        const res = await this.bridgeContract.methods.CreateRainbow(tokenAddress).send(sendOption)
        return res.transactionHash
    }

    async getProof(txHash) {
        let resp = await this.gp.receiptProof(txHash)

        let rawReceipt = await this.web3.eth.getTransactionReceipt(txHash)
        let blockHash = rawReceipt.blockHash.replace("0x", "")
        return {
            hash: Buffer.from(blockHash, 'hex'),
            root: resp.header.receiptRoot,
            proof: encode(resp.receiptProof),
            key: encode(parseInt(resp.txIndex))
        }
    }

    async handleHmyProof(proofData) {
        let hash = proofData.hash
        let root = proofData.root
        let key = proofData.key
        let proof = proofData.proof
        let options = await this._getUserOption()

        let resp = await this.bridgeContract.methods.ExecProof(hash, root, key, proof)
            .send(options)
        return resp
    }

    async mint(account, amount) {
        const sendOption = await this._getAdminOption()
        await this.tokenContract.methods.mint(account, amount).send(sendOption)
    }

    async approve(targetAddr, amount) {
        const sendOption = await this._getUserOption()
        await this.tokenContract.methods.approve(targetAddr, amount).send(sendOption)
    }

    async lock(hmyAddr, amount) {
        const sendOption = await this._getUserOption()
        let txn = await this.bridgeContract.methods.RainbowTo(this.tokenAddress, hmyAddr, amount).send(sendOption)
        return txn.events.Locked.transactionHash
    }

    async _getAdminOption() {
        const gasPrice = await this._estimateGasPrice()
        const gasLimit = this._getGasLimit()
        return {
            from: this.adminAccount.address,
            gas: gasLimit,
            gasPrice: gasPrice,
        }
    }

    async _getUserOption() {
        const gasPrice = await this._estimateGasPrice()
        const gasLimit = this._getGasLimit()
        return {
            from: this.userAccount.address,
            gas: gasLimit,
            gasPrice: gasPrice,
        }
    }

    async _estimateGasPrice() {
        let rawPrice = await this.web3.eth.getGasPrice()
        let parsed = new BigNumber(rawPrice)
        let multiplier = new BigNumber(process.env.ETH_GAS_PRICE_MULTIPLER)
        return (parsed * multiplier).toString()
    }

    _getGasLimit() {
        return process.env.ETH_GAS_LIMIT
    }
}


module.exports = EthBridge

