const EVerifierTest = require("../../everifier/build/contracts/EVerifierTest.json");
const { HmyWeb3 } = require('../lib/hmyWeb3');
const {Receipt} = require('eth-object');

async function deployEVerifier(hmyUrl) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const tx = hmyWeb3.ContractDeploy(EVerifierTest.abi, EVerifierTest.bytecode);
    return await hmyWeb3.sendTx(tx); //options.address
}

async function MPTProof(hmyUrl, evAddress, proof) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const everifier = hmyWeb3.ContractAt(EVerifierTest.abi, evAddress);
    const rlpReceipts = await everifier.methods.MPTProof(proof.root, proof.key, proof.proof).call();
    return Receipt.fromHex(rlpReceipts);
}

module.exports = {deployEVerifier, MPTProof}