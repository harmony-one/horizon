const ElcABI = require("../../tools/elc/abi/EthereumLightClient.json");
const { getBlockByNumber, getHeaderProof } = require('../ethashProof/BlockProof');
const { HmyWeb3 } = require('../lib/hmyWeb3');
const Web3 = require('web3');

async function blockRelay(dagPath, ethUrl, hmyWeb3, elcAddress) {
    const client = hmyWeb3.ContractAt(ElcABI.abi, elcAddress);
    const clientMethods = client.methods;
    const lastBlockNo = await clientMethods.getBlockHeightMax().call();
    console.log("ELC last block number:", lastBlockNo);
    const blockRelay = Number(lastBlockNo) + 1;
    console.log("block to relay:", blockRelay);
    const header = await getBlockByNumber(ethUrl, blockRelay);
    this.web3 = new Web3(ethUrl);
    console.log('header hash', this.web3.utils.keccak256(header.serialize()));
    const proofs = getHeaderProof(dagPath, header)
    const rlpHeader = header.serialize();
    try {
        await clientMethods.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs).send({ gas: 5000000 });
    } catch (error) {
        console.log(error);
    }
    const blockNo = await clientMethods.getBlockHeightMax().call();
    console.log("new block number:", blockNo);

    const canoncicalHead = await clientMethods.canonicalHead().call();
    console.log("Canonical Head:", Web3.utils.toHex(canoncicalHead));

}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function blockRelayLoop(dagPath, ethUrl, hmyUrl, elcAddress) {
    const hmyWeb3 = new HmyWeb3(hmyUrl);
    while (1) {
        try {
            blockRelay(dagPath, ethUrl, hmyWeb3, elcAddress);
        } catch (e) {
            console.error(e);
        }
        await sleep(10000);
    }
}

module.exports = {
    blockRelayLoop
}
