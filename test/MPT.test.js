const {
    expect
} = require('chai')
const {
    EProver,
    Receipt
} = require('../src/eprover')
const {
    ethers
} = require('hardhat')
const recepits = require('./receipts.json')

describe('Merkle-Patricia-Trie Test', () => {
    before(async function () {
        const MPTTest = await ethers.getContractFactory('MPTTest')
        this.MPTTest = await MPTTest.deploy()
        this.ep = new EProver(undefined, recepits)
    })

    it('Receipts Porve V2: validateProof', async function () {
        const MPTTest = this.MPTTest
        const ep = this.ep
        const block = await ep.getBlock('0x80668d2bd5d87ff6e79cb9847c41556fc8b09924b234d52cf6913292824cfa3d')
        for (const txIndex in block.transactions) {
            const txHash = block.transactions[txIndex]
            const proof = await ep.receiptProofABIV2(txHash)
            const rlpReceipt = await MPTTest.validateProof(proof.root, proof.key, proof.proof)
            const recepit = await ep.getReceipt(txHash)
            expect(Receipt.fromHex(rlpReceipt).toHex()).equals(rlpReceipt)
            expect(rlpReceipt).equals(Receipt.fromRpc(recepit).toHex())
        }
    })
})
