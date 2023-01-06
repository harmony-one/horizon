const { encode } = require('eth-util-lite')
const { GetProof } = require('eth-proof')
const { Keccak } = require('sha3')

function sha3 (str) {
    const hash = new Keccak(256)
    hash.update(str)
    return hash.digest()
}

class EProver {
    constructor (ethUrl) {
        this.gp = new GetProof(ethUrl)
    }

    async receiptProof (txHash) {
        console.log(`txHash: ${txHash}`)
        const resp = await this.gp.receiptProof(txHash)
        // const resp = await this.gp.transactionProof(txHash)
        console.log('Have Proof transaction')
        return {
            hash: sha3(resp.header.serialize()),
            root: resp.header.receiptRoot,
            proof: encode(resp.receiptProof),
            key: encode(Number(resp.txIndex)) // '0x12' => Nunmber
        }
    }
}

module.exports = { EProver }
