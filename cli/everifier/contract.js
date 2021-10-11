const EProver = require("../../tools/eprover/abi/EthereumProver.json");
const { HmyWeb3 } = require('../lib/hmyWeb3');
const { Receipt } = require('eth-object');

async function deployEVerifier(hmyUrl) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const tx = hmyWeb3.ContractDeploy(EProver.abi, EProver.bytecode);
    return await hmyWeb3.sendTx(tx); //options.address
}

async function validateMPTProof(hmyUrl, evAddress, proof) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    const everifier = hmyWeb3.ContractAt(EVerifierTest.abi, evAddress);
    const rlpReceipts = await everifier.methods.validateMPTProof(proof.root, proof.key, proof.proof).call();
    return Receipt.fromHex(rlpReceipts);
}

module.exports = { deployEVerifier, validateMPTProof }