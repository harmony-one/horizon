const { expect } = require('chai');
const { EProver } = require('../tools/eprover');
const { Receipt } = require('eth-object');
const {ethers} = require('hardhat');
const recepits = require('./receipts.json');
const { encode } = require('eth-util-lite');

describe('AllTest', () => {
    before(async function() {
        const MPTTest = await ethers.getContractFactory("MPTTest");
        this.MPTTest = await MPTTest.deploy();
        this.ep = new EProver(undefined, recepits);
    });

    it('Receipts Porve V1: validateMPTProof', async function() {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0xf67c0b7f2827cb8f675934729740e3ec34ecd5c62ac446c1125df331ac67268d')
        for(const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex];
            const proof = await ep.receiptProofABI(txHash);
            const rlpReceipt = await MPTTest.validateMPTProof(proof.root, proof.key, proof.proof);
            const recepit = await ep.getReceipt(txHash);
            expect(Receipt.fromRpc(recepit).toHex()).equals(rlpReceipt)
        }
    })

    it('Receipts Porve V2: verifyTrieProof', async function() {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0xf67c0b7f2827cb8f675934729740e3ec34ecd5c62ac446c1125df331ac67268d')
        for(const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex];
            const proof = await ep.receiptProofABIV2(txHash);
            const success = await MPTTest.verifyTrieProof(proof.root, proof.nibbles, proof.proof.raw.map(encode), proof.receipt)
            expect(success).equals(true)
        }
    })

    it('Receipts Porve V2: validateProof', async function() {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0xf67c0b7f2827cb8f675934729740e3ec34ecd5c62ac446c1125df331ac67268d')
        for(const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex];
            const proof = await ep.receiptProofABIV2(txHash);
            const rlpReceipts = await MPTTest.validateProof(proof.root, proof.proofIndex, proof.proof.raw.map(encode))
            expect(rlpReceipts.slice(2)).equals(proof.receipt.toString('hex'))
        }
    })

    it('Receipts Porve V2: validateProofOptimize', async function() {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0xf67c0b7f2827cb8f675934729740e3ec34ecd5c62ac446c1125df331ac67268d')
        for(const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex];
            const proof = await ep.receiptProofABIV2(txHash);
            const pathInv = Buffer.from(proof.proofIndex).reverse()
            const pathInvU256 = '0x'+pathInv.toString('hex')
            const rlpReceipts = await MPTTest.validateProofOptimize(proof.root, pathInvU256, encode(proof.proof))
            expect(rlpReceipts.slice(2)).equals(proof.receipt.toString('hex'))
        }
    })
})