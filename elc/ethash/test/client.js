const ClientSol = artifacts.require("Client");
const EthashUtil = require('@ethereumjs/ethash/dist/util');
const { getBlockByNumber } = require("../lib/getBlockHeader.js");
const { DagProof } = require("../lib/DagProof.js");

const TestCount = 1;

describe("LightClient test", async accounts => {
    it(`add ${TestCount} blocks`, async () => {
        const clientSol = await ClientSol.deployed();
        for(let i = 0; i < TestCount; i++){
            const lastBlockNo = await clientSol.getBlockHeightMax();
            const newBlockNo = lastBlockNo.toNumber()+1;
            const header = await getBlockByNumber(newBlockNo);
            const epoch = EthashUtil.getEpoc(header.number);
            const dagProof = new DagProof(epoch);
            const proofs = dagProof.getProof(header);
            const rlpHeader = header.serialize();
            await clientSol.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs, {gas:5000000});
            
            const blockNo = await clientSol.getBlockHeightMax();
            assert.equal(blockNo.toNumber(), newBlockNo);
            //const result = await clientSol.addBlockHeader.call(rlpHeader, proofs.dagData, proofs.proofs, {gas:8000000});
            //assert.equal(result, true);
        }
    });
  });