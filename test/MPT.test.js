const { expect } = require('chai');
const { EProver } = require('../tools/eprover');
const { Receipt } = require('eth-object');
const {ethers} = require('hardhat');
const recepits = require('./receipts.json');

describe('Merkle-Patricia-Trie Test', () => {
    before(async function() {
        const MPTTest = await ethers.getContractFactory("MPTTest");
        this.MPTTest = await MPTTest.deploy();
        this.ep = new EProver(undefined, recepits);
    });

    it('Receipts Porve V2: validateProof', async function() {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0xf67c0b7f2827cb8f675934729740e3ec34ecd5c62ac446c1125df331ac67268d')
        for(const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex];
            const proof = await ep.receiptProofABIV2(txHash);
            const rlpReceipts = await MPTTest.validateProof(proof.root, proof.key, proof.proof)
            const recepit = await ep.getReceipt(txHash);
            expect(rlpReceipts).equals(Receipt.fromRpc(recepit).toHex())
        }
    })
})