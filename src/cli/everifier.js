const EProver = require('../../build/contracts/EthereumProver.sol/EthereumProver.json')
const { EthEthers } = require('../lib/ethEthers')
const { Receipt } = require('eth-object')

async function deployEVerifier (hmyUrl) {
    const hmyEthers = new EthEthers(hmyUrl)
    const eProver = await hmyEthers.ContractDeploy(EProver.abi, EProver.bytecode)
    return eProver.address // options.address
}

async function validateMPTProof (hmyUrl, evAddress, proof) {
    const hmyEthers = new EthEthers(hmyUrl)
    // const everifier = hmyEthers.ContractAt(EVerifierTest.abi, evAddress)
    const everifier = hmyEthers.ContractAt(EProver.abi, evAddress)
    const rlpReceipts = await everifier.method.validateMPTProof(proof.root, proof.key, proof.proof)
    return Receipt.fromHex(rlpReceipts)
}

module.exports = { deployEVerifier, validateMPTProof }
