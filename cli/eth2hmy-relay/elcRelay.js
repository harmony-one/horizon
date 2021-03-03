const ElcABI = require("../../elc/build/contracts/Client.json");
const { getBlock, getHeaderProof } = require('../ethashProof/BlockProof');
const { HmyWeb3 } = require('../lib/hmyWeb3');

async function blockRelay(dagPath, ethUrl, hmyWeb3, elcAddress) {
    const client = hmyWeb3.ContractAt(ElcABI.abi, elcAddress);
    const clientMethods = client.methods;
    const lastBlockNo = await clientMethods.getBlockHeightMax().call();
    console.log("ELC last block number:", lastBlockNo);
    const blockRelay = Number(lastBlockNo) + 1;
    console.log("block to relay:", blockRelay);
    const header = await getBlock(ethUrl, blockRelay);
    const proofs = getHeaderProof(dagPath, header)
    const rlpHeader = header.serialize();
    await clientMethods.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs).send({ gas: 5000000 });
    const blockNo = await clientMethods.getBlockHeightMax().call();
    console.log("new block number:", blockNo);
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
