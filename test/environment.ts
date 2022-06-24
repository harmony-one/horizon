
const { ethers } = require('ethers')
const Web3 = require('web3')
const config = require('../config.js')
const { Logger } = require('../src/lib/logger.js')
const EthLockerSol = require('../build/contracts/TokenLockerOnEthereum.sol/TokenLockerOnEthereum.json')
const EthlcSol = require('../build/contracts/EthereumLightClient.sol/EthereumLightClient.json')
const HmylcSol = require('../build/contracts/HarmonyLightClient.sol/HarmonyLightClient.json')
const TokenSol = require('../build/contracts/FaucetToken.sol/FaucetToken.json')
// const options = {
//     gasLimit: config.gasLimit,
//     gasPrice: config.gasPrice
// }

async function main () {
    console.log('Hi')
    const hmyTokenAddress = '0x4e59AeD3aCbb0cb66AF94E893BEE7df8B414dAB1'
    const hmyProvider = await new ethers.providers.JsonRpcProvider(config.hmyURL)
    const hmySigner = await new ethers.Wallet(config.privateKey, hmyProvider)
    const hmyToken = await new ethers.Contract(hmyTokenAddress, TokenSol.abi, hmySigner)
    const hmyElcAddress = '0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22'
    const hmyElc = await new ethers.Contract(hmyElcAddress, EthlcSol.abi, hmySigner)

    const ethTokenAddress = '0x4e59AeD3aCbb0cb66AF94E893BEE7df8B414dAB1'
    const ethProvider = await new ethers.providers.JsonRpcProvider(config.ethURL)
    const ethSigner = await new ethers.Wallet(config.privateKey, ethProvider)
    const web3 = new Web3(config.ethURL)
    const ethToken = await new ethers.Contract(ethTokenAddress, TokenSol.abi, ethSigner)
    const web3EthToken = new web3.eth.Contract(TokenSol.abi, ethTokenAddress)
    const ethHlcAddress = '0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22'
    // const ethHlcAddress = '0xC7c92cCd5f8101DABBC9633eD9A38B3e928a76aF'
    // console.log(`ethHlcCode: ${JSON.stringify(await ethProvider.getCode(ethHlcAddress))}`)
    const ethHlc = await new ethers.Contract(ethHlcAddress, HmylcSol.abi, ethSigner)
    const web3EthHlc = new web3.eth.Contract(HmylcSol.abi, ethHlcAddress)
    const ethLockerAddress = '0x017f8C7d1Cb04dE974B8aC1a6B8d3d74bC74E7E1'
    const ethLocker = await new ethers.Contract(ethLockerAddress, EthLockerSol.abi, ethSigner)

    const hardhatTokenAddress = '0x4e59AeD3aCbb0cb66AF94E893BEE7df8B414dAB1'
    const hardhatProvider = await new ethers.providers.JsonRpcProvider(config.hardhatURL)
    const hardhatSigner = await new ethers.Wallet(config.privateKey, hardhatProvider)
    const hardhatToken = await new ethers.Contract(hardhatTokenAddress, TokenSol.abi, hardhatSigner)
    // const hardhatHlcAddress = '0x98c95AB3B42a0B29F55555365abD70FCd2E1327A'
    // console.log(`hardhatHlcCode: ${JSON.stringify(await hardhatProvider.getCode(hardhatHlcAddress))}`)
    const hardhatHlcAddress = '0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22'
    console.log(`hardhatHlcCode: ${JSON.stringify(await hardhatProvider.getCode(hardhatHlcAddress))}`)
    const hardhatHlc = await new ethers.Contract(hardhatHlcAddress, HmylcSol.abi, hardhatSigner)

    console.log('============ Starting Test ===========')
    console.log('============ Starting Harmony ========')
    const hmySymbol = await hmyToken.symbol()
    Logger.debug('Harmony Symbol:', hmySymbol)
    const hmyLastBlockNo = await hmyElc.getBlockHeightMax()
    Logger.debug('Harmony LastBlockNo:', hmyLastBlockNo.toString())
    const hmyFirstBlockNo = await hmyElc.firstBlock()
    Logger.debug('Harmony firstBlock:', hmyFirstBlockNo.toString())
    console.log('============ Ending Harmony ===========')

    console.log('============ Starting LocalGeth =======')
    const ethSymbol = await ethToken.symbol()
    Logger.debug('LocalGeth Symbol:', ethSymbol)
    const web3EthSymbol = await web3EthToken.methods.symbol().call()
    Logger.debug('LocalGeth Symbol:', web3EthSymbol)
    const web3EthOldestEpochStored = await web3EthHlc.methods.oldestEpochStored().call()
    Logger.debug('LocalGeth web3EthOldestEpochStored:', JSON.stringify(web3EthOldestEpochStored.toString()))
    const ethOldestEpochStored = await ethHlc.oldestEpochStored()
    Logger.debug('LocalGeth oldestEpochStored:', ethOldestEpochStored.toString())
    const ethTxMapped = await ethLocker.TxMapped(ethTokenAddress)
    Logger.debug('LocalGeth ethTxMapped:', ethTxMapped.toString())
    console.log('============ Ending LocalGeth ==========')

    console.log('============ Starting Hardhat ==========')
    const hardhatSymbol = await hardhatToken.symbol()
    Logger.debug('Hardhat Symbol:', hardhatSymbol)
    const hardhatOldestEpochStored = await hardhatHlc.oldestEpochStored()
    Logger.debug('Hardhat OldestEpochStored:', hardhatOldestEpochStored.toString())
    console.log('============ Ending Hardhat ===========')
    Logger.debug('=========== Ending Test ==============')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
