require("dotenv").config({path: './envs/hmy.env'})
const Web3 = require("web3");

const { Harmony } = require("@harmony-js/core")
const { Account } = require('@harmony-js/account')
const { ChainID, ChainType } = require("@harmony-js/utils")
const tokenConfig = require("../tokenConfig.json")

const TokenMapReqEventSig = '0x78591F651C27EEF63481B7FD779E44C2426CBE82C7050FE9BC90B6707EFBC3D3'

process.env.HMY_NODE_URL='https://api.s0.b.hmny.io'
process.env.PRIVATE_KEY='3054d9107ed6900390d0de14fee63d1ac0f430f5e89a954a2b255a5fff639575'
process.env.PRIVATE_KEY_USER='3054d9107ed6900390d0de14fee63d1ac0f430f5e89a954a2b255a5fff639575'
process.env.GAS_LIMIT=6721900
process.env.GAS_PRICE=1000000000
process.env.PROOF_NODE_URL = 'https://ropsten.infura.io/v3/ef2ba412bbaf499191f98908f9229490'

process.env.ETH_NODE_URL='https://ropsten.infura.io/v3/ef2ba412bbaf499191f98908f9229490'




//Hmy Contracts
class HmyBridge {
    constructor(bridgeAddress, tokenAddress) {
        const web3 = new Web3(process.env.ETH_NODE_URL)
       

        this.web3 = web3
        
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
            console.log("initialise HmyBridge with bridgeAddress: "+ this.bridgeAddress)
        } else {
            this.bridgeContract = hmy.contracts.createContract(bridgeJson.abi)
        }

        if (tokenAddress) {
            this.tokenAddress = tokenAddress
            this.tokenContract = hmy.contracts.createContract(tokenJson.abi, tokenAddress)
            console.log("initialise HmyBridge with hrc tokenAddress: ", this.tokenAddress)
            
        } else {
            this.tokenContract = hmy.contracts.createContract(tokenJson.abi)
        }

        

        this.proofNode = process.env.PROOF_NODE_URL

        const clientJson = require("../../../elc/ethClient/build/contracts/Client.json");
        const ethClientAddr = "0x4a7f0a457f077f7d4dcc249935308e50924e1981" //await deploy_contract(json) in elc/ethClient/test/deploy.js
        this.ethClientContract = hmy.contracts.createContract(
        clientJson.abi,
        ethClientAddr);
    
    }

    async waitBlockHashSafeOnEthClient(txHash){
        const options = { gasPrice: 1000000000, gasLimit: 6721900 };
        let rawReceipt = await this.web3.eth.getTransactionReceipt(txHash)
        // console.log(rawReceipt)
        const txBlockNumber = rawReceipt.blockNumber
        console.log("wait till block hash of transaction in block no: "+ txBlockNumber + " is recorded on eth client contract on hmy chain  ")

        let unsafe = true
        while (unsafe) {
            let clientBlockNumber
            try {
              
              //  retry n times ethClientContract.getBlockHeightMax() 
              // Return back to loop to avoid crash.
      
              const maxHeight = await this.ethClientContract.methods.getBlockHeightMax().call(options);
              clientBlockNumber = parseInt(maxHeight)

              console.log(" EthClientContract block Number on Harmony Chain: "+ clientBlockNumber+ " tx blockNumber: "+ txBlockNumber)      
              if(clientBlockNumber >= txBlockNumber){
                  unsafe = false;
                }

            } catch (e) {
                console.log(e)
                continue
            }
        }       

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

        const ethClientAddr = "0x4a7f0a457f077f7d4dcc249935308e50924e1981" //from the line await deploy_contract(json) in elc/ethClient/test/deploy.js
        console.log("updating eth client contract address "+ ethClientAddr + " in bridge contract ")
        
         response = await this.bridgeContract.methods.changeLightClient(ethClientAddr).send(options)
        //  console.log(response)
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
            "method": "hmy_getReceipt",
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
        console.log(respData)
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
