const { Receipt:LegacyReceipt } = require('eth-object')
class Receipt extends LegacyReceipt {
    type=0
    static fromRpc(rpcResult) {
        const leagcyReceipt = LegacyReceipt.fromRpc(rpcResult)
        const receipt = new Receipt(leagcyReceipt.raw)
        receipt.type = Number(rpcResult.type || 0)
        return receipt
    }
    static fromBuffer(buf){
        if (!buf) return new Receipt()
        if(buf[0] < 0x7f) {
            const receipt = new Receipt(decode(buf))
            receipt.type = buf[0]
        }
        return new Receipt(decode(buf))
    }
    static fromHex(hex=''){
        const buffer = Buffer.from(hex.startsWith('0x')?hex.slice(2):hex, 'hex')
        return Receipt.fromBuffer(buffer)
    }

    serialize() {
        const serialized = super.serialize()
        // EIP2718: Receipt is either TransactionType || ReceiptPayload or LegacyReceipt
        return this.type ? Buffer.concat([Buffer.from([this.type]), serialized]) : serialized
    }
    toBuffer() { return this.serialize() }
    toHex() { return '0x'+this.toBuffer().toString('hex') }
}

module.exports = Receipt