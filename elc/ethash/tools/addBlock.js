const ClientSol = artifacts.require("Client");
const EthashUtil = require('@ethereumjs/ethash/dist/util');
const { getBlockByNumber } = require("../lib/getBlockHeader.js");
const { DagProof } = require("../lib/DagProof.js");

async function main() {
    const clientSol = await ClientSol.deployed();
    const lastBlockNo = await clientSol.getBlockHeightMax();
    console.log("last block number:", lastBlockNo.toString());
    const newBlockNo = lastBlockNo.toNumber()+1;
    const header = await getBlockByNumber(newBlockNo);
    const epoch = EthashUtil.getEpoc(header.number);
    const dagProof = new DagProof(epoch);
    const proofs = dagProof.getProof(header);
    const rlpHeader = header.serialize();
    await clientSol.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs, {gas:5000000});
    const blockNo = await clientSol.getBlockHeightMax();
    console.log("new block number:", blockNo.toString());

}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
