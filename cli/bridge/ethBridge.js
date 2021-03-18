const { Bridge } = require('./bridge');
const { EthWeb3 } = require('../lib/ethWeb3');
const { EProve } = require('../../eprover');
const BridgeSol = require("../../bridge/build/contracts/RainbowOnes.json");


class EthBridge extends Bridge {
    constructor(rpcUrl, bridgeAddress) {
        const web3 = new EthWeb3(rpcUrl);
        const contract = web3.ContractAt(BridgeSol.abi, bridgeAddress);
        const eprove = new EProve(rpcUrl); // TODO
        super(web3, contract, eprove);
    }

    static async deploy(rpcUrl) {
        let web3 = new EthWeb3(rpcUrl);
        const tx = web3.ContractDeploy(BridgeSol.abi, BridgeSol.bytecode);
        const contract = await web3.sendTx(tx); //options.address or _address
        return new EthBridge(rpcUrl, contract._address);
    }
}

module.exports = {
    EthBridge
}