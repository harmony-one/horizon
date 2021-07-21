const ClientSol = artifacts.require("Client");
const EthashUtil = require('@ethereumjs/ethash/dist/util');
const { getBlockByNumber } = require("../lib/getBlockHeader.js");
const { DagProof } = require("../lib/DagProof.js");
const yargs = require('yargs');

// example: truffle --network=xxx exec cli/eth2one-relay.js -c contractAddress -e https://mainnet.infura.io/xx
const argv = yargs
.option('elc', {
    alias: 'c',
    description: 'Ethereum light client contract address',
    type: 'string',
})
.option('block', {
    alias: 'b',
    description: 'number of a block to relay',
    type: 'string',
})
.option('ethurl', {
    description: 'Ethereum RPC URL',
    type: 'string',
}).env()
.help()
.alias('help', 'h').argv;

const EthUrl = argv.ethurl;
const ElcAddress = argv.elc;
const BlockX = argv.block;

async function main() {
    const clientSol = ElcAddress ? await ClientSol.at(ElcAddress) : await ClientSol.deployed();
    const lastBlockNo = await clientSol.getBlockHeightMax();
    console.log("last block number:", lastBlockNo.toString());
    const blockRelay = BlockX || lastBlockNo.toNumber()+1;
    console.log("block to relay:", blockRelay.toString());
    const header = await getBlockByNumber(EthUrl, blockRelay);
    const epoch = EthashUtil.getEpoc(header.number);
    const dagProof = new DagProof(epoch);
    const proofs = dagProof.getProof(header);
    const rlpHeader = header.serialize();
    a = await clientSol.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs, {gas:5000000});
    const blockNo = await clientSol.getBlockHeightMax();
    console.log("new block number:", blockNo.toString(), a);
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
