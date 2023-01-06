const { Bridge } = require('./bridge')
const { EthBridge } = require('./ethBridge')
const { HmyBridge } = require('./hmyBridge')
const { FaucetERC20, ERC20 } = require('./token')
const { EthEthers } = require('../lib/ethEthers')
const { Logger } = require('../lib/logger.js')
const FakeClient = require('../../build/contracts/EthereumLightClient.sol/EthereumLightClient.json')

async function deployBridges (ethUrl, hmyUrl) {
    const ethBridge = await EthBridge.deploy(ethUrl)
    const hmyBridge = await HmyBridge.deploy(hmyUrl)
    await hmyBridge.Initialize()
    await hmyBridge.Bind(ethBridge.contract._address)
    await ethBridge.Initialize()
    await ethBridge.Bind(hmyBridge.contract._address)
    return { ethBridge, hmyBridge }
}

async function tokenMap (
    srcUrl,
    srcBridgeAddress,
    destUrl,
    destBridgeAddress,
    token
) {
    const srcBridge = new EthBridge(srcUrl, srcBridgeAddress)
    const destBridge = new HmyBridge(destUrl, destBridgeAddress)
    Logger.debug('Have Bridges')
    await Bridge.TokenMap(srcBridge, destBridge, token)
    Logger.debug('Have completed contract Bridge.TokenMap')
    return { ethBridge: srcBridge, hmyBridge: destBridge }
}

async function tokenTo (
    srcUrl,
    srcBridgeAddress,
    destUrl,
    destBridgeAddress,
    token,
    receipt,
    amount
) {
    const srcBridge = new EthBridge(srcUrl, srcBridgeAddress)
    const destBridge = new HmyBridge(destUrl, destBridgeAddress)

    if (amount > 0) {
        const erc20 = new ERC20(srcBridge.ethers, token)
        await erc20.approve(srcBridge.contract._address, amount)
        await Bridge.TokenTo(srcBridge, destBridge, token, receipt, amount)
    }
    return { ethBridge: srcBridge, hmyBridge: destBridge }
}

async function tokenBack (
    srcUrl,
    srcBridgeAddress,
    destUrl,
    destBridgeAddress,
    token,
    receipt,
    amount
) {
    const srcBridge = new HmyBridge(srcUrl, srcBridgeAddress)
    const destBridge = new EthBridge(destUrl, destBridgeAddress)
    if (amount > 0) {
        const erc20 = new ERC20(srcBridge.ethers, token)
        await erc20.approve(srcBridge.contract._address, amount)
        await Bridge.TokenBack(srcBridge, destBridge, token, receipt, amount)
    }
    return { hmyBridge: srcBridge, ethBridge: destBridge }
}

function ChangeLightClient (rpcUrl, bridgeAddress, clientAddress) {
    const bridge = new EthBridge(rpcUrl, bridgeAddress)
    return bridge.ChangeLightClient(clientAddress)
}

async function deployFakeLightClient (rpcUrl) {
    const ethers = new EthEthers(rpcUrl)
    const client = await ethers.ContractDeploy(FakeClient.abi, FakeClient.bytecode)
    return client.address
}

async function deployFaucet (ethUrl) {
    const ethers = new EthEthers(ethUrl)
    return FaucetERC20.deploy(ethers)
}

async function tokenStatus (ethers, address, user) {
    const token = new ERC20(ethers, address)
    const name = await token.name()
    const balance = await token.balanceOf(user)
    return { token: address, name, account: ethers.address, balance }
}

module.exports = {
    deployBridges,
    tokenMap,
    tokenTo,
    tokenBack,
    tokenStatus,
    deployFaucet,
    ChangeLightClient,
    deployFakeLightClient
}
