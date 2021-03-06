const EVerifierTest = artifacts.require('EVerifierTest');
const ReceiptProofs = require('./receiptProofs.json');
const {Receipt} = require('eth-object');

describe("EVerifier test", async accounts => {
    it("verify receipts", async () => {
        const everifier = await EVerifierTest.new();
        const keys = Object.keys(ReceiptProofs);
        for(let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const proof = ReceiptProofs[key];
            const rlpReceipts = await everifier.MPTProof(proof.root, proof.key, proof.proof);
            const receipt = Receipt.fromHex(rlpReceipts);
            assert.equal(receipt.toHex(), rlpReceipts);
        }
    })
})

