const GateManager = artifacts.require("GateManager");
const RouterFactory = artifacts.require("RouterFactory");
const LightClientUnsafe = artifacts.require("LightClientUnsafe");

const D = console.log;

const ThisChainName = "harmony";
const BindChainName = ThisChainName; //"ethereum";

module.exports = async function (deployer, network) {
    D("network:", network);
    await deployer.deploy(LightClientUnsafe);
    const client = await LightClientUnsafe.deployed();
    await deployer.deploy(RouterFactory);
    const factory = await RouterFactory.deployed();
    await deployer.deploy(GateManager, factory.address, ThisChainName);
    await GateManager.deployed();
    const keccak256 = web3.utils.keccak256;
    const chainType = keccak256(BindChainName);
    await factory.addLightClient(chainType, client.address);
    //await manager.bindGateManager(chainType, manager.address);
};