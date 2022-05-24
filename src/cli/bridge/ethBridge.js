const { Bridge } = require('./bridge');
const { EthWeb3 } = require('../lib/ethWeb3');
const { EProver } = require('../../tools/eprover');
const BridgeSol = require("./abi/TokenLockerOnEthereum.json");


class EthBridge extends Bridge {
    constructor(rpcUrl, bridgeAddress) {
        const web3 = new EthWeb3(rpcUrl);
        const contract = web3.ContractAt(BridgeSol.abi, bridgeAddress);
        const eprover = new EProver(rpcUrl); // TODO
        super(web3, contract, eprover);
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