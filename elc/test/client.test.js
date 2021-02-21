const ClientSol = artifacts.require("Client");

const TestCount = 15;
const StartBlock = 11610000;

function getBlockProof(blockNo) {
    return require(`./data/blocks/block_${blockNo}.json`);
}

describe("LightClient test", async accounts => {
    it(`add ${TestCount} blocks`, async () => {
        const initBlock = getBlockProof(StartBlock);
        const clientSol = await ClientSol.new(initBlock.header_rlp);
        for(let i = StartBlock+1; i <= StartBlock+TestCount; i++) {
            console.log(i);
            const lastBlockNo = await clientSol.getBlockHeightMax();
            const newBlockNo = lastBlockNo.toNumber()+1;
            assert.equal(i, newBlockNo);
            const proofs = getBlockProof(i);
            await clientSol.addBlockHeader(proofs.header_rlp, proofs.elements, proofs.merkle_proofs, {gas:5000000});
            const blockNo = await clientSol.getBlockHeightMax();
            assert.equal(blockNo.toNumber(), newBlockNo);
        }
    });
  });