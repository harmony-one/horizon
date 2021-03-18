const { Bridge } = require("./bridge");
const { EthBridge } = require('./ethBridge');
const { HmyBridge } = require('./hmyBridge');
const { FaucetERC20, ERC20 } = require('./token');
const { EthWeb3 } = require('../lib/ethWeb3');
const FakeClient = require("../../bridge/build/contracts/LightClientFake.json");

async function deployBridges(ethUrl, hmyUrl) {
    const ethBridge = await EthBridge.deploy(ethUrl);
    const hmyBridge = await HmyBridge.deploy(hmyUrl);
    await ethBridge.Bind(hmyBridge.contract._address);
    await hmyBridge.Bind(ethBridge.contract._address);
    return { ethBridge, hmyBridge };
}

async function tokenMap(srcUrl, srcBridgeAddress, destUrl, destBridgeAddress, token) {
    const srcBridge = new EthBridge(srcUrl, srcBridgeAddress);
    const destBridge = new HmyBridge(destUrl, destBridgeAddress);
    await Bridge.TokenMap(srcBridge, destBridge, token);
    return { ethBridge: srcBridge, hmyBridge: destBridge };
}

async function tokenTo(srcUrl, srcBridgeAddress, destUrl, destBridgeAddress, token, receipt, amount) {
    const srcBridge = new EthBridge(srcUrl, srcBridgeAddress);
    const destBridge = new HmyBridge(destUrl, destBridgeAddress);

    if(amount > 0) {
        const erc20 = new ERC20(srcBridge.web3, token);
        await erc20.approve(srcBridge.contract._address, amount);
        await Bridge.TokenTo(srcBridge, destBridge, token, receipt, amount);
    }
    return { ethBridge: srcBridge, hmyBridge: destBridge };
}

async function tokenBack(srcUrl, srcBridgeAddress, destUrl, destBridgeAddress, token, receipt, amount) {
    const srcBridge = new HmyBridge(srcUrl, srcBridgeAddress);
    const destBridge = new EthBridge(destUrl, destBridgeAddress);
    if(amount > 0) {
        const erc20 = new ERC20(srcBridge.web3, token);
        await erc20.approve(srcBridge.contract._address, amount);
        await Bridge.TokenBack(srcBridge, destBridge, token, receipt, amount);
    }
    return { hmyBridge: srcBridge, ethBridge: destBridge };
}

function ChangeLightClient(rpcUrl, bridgeAddress, clientAddress) {
    const bridge = new EthBridge(rpcUrl, bridgeAddress);
    return bridge.ChangeLightClient(clientAddress);
}

async function deployFakeLightClient(rpcUrl) {
    const web3 = new EthWeb3(rpcUrl);
    const tx = web3.ContractDeploy(FakeClient.abi, FakeClient.bytecode);
    const client = await web3.sendTx(tx);
    return client.options.address;
}

async function deployFaucet(ethUrl) {
    const web3 = new EthWeb3(ethUrl);
    return FaucetERC20.deploy(web3);
}

async function tokenStatus(web3, address, user) {
    const token = new ERC20(web3, address);
    const name = await token.name();
    const balance = await token.balanceOf(user);
    return { token:address, name, account:web3.address, balance };
}

module.exports = {
    deployBridges,
    tokenMap, tokenTo, tokenBack,
    tokenStatus, deployFaucet,
    ChangeLightClient, deployFakeLightClient
};