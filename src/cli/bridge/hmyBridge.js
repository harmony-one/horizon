const { Bridge } = require('./bridge');
const { HmyWeb3 } = require('../lib/hmyWeb3');
const BridgeSol = require("./abi/TokenLockerOnHarmony.json");


class HmyBridge extends Bridge {
    constructor(rpcUrl, bridgeAddress) {
        const web3 = new HmyWeb3(rpcUrl);
        const contract = web3.ContractAt(BridgeSol.abi, bridgeAddress);
        // const hprove = null; // TODO
        const { EProver } = require('../../tools/eprover');
        const hprove = new EProver(rpcUrl); // TODO

        super(web3, contract, hprove);
    }

    static async deploy(rpcUrl) {
        let web3 = new HmyWeb3(rpcUrl);
        const tx = web3.ContractDeploy(BridgeSol.abi, BridgeSol.bytecode);
        const contract = await web3.sendTx(tx); //options.address
        return new HmyBridge(rpcUrl, contract._address);
    }
}

module.exports = {
    HmyBridge
}