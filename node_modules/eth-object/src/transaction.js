const { decode, toBuffer } = require('eth-util-lite')
const EthObject = require('./ethObject')

class Transaction extends EthObject{

  static get fields(){ return [
    'nonce',
    'gasPrice',
    'gasLimit',
    'to',
    'value',
    'data',
    'v',
    'r',
    's',
  ] }

  constructor(raw = Transaction.NULL){
    super(Transaction.fields, raw)
  }

  static fromBuffer(buf){ return buf ? new Transaction(decode(buf)) : new Transaction() }
  static fromHex(hex){ return hex ? new Transaction(decode(hex)) : new Transaction() }
  static fromRaw(raw){ return new Transaction(raw) }
  static fromObject(rpcResult){ return Transaction.fromRpc(rpcResult) }
  static fromRpc(rpcResult){
    return new Transaction([
      toBuffer(rpcResult.nonce),
      toBuffer(rpcResult.gasPrice),
      toBuffer(rpcResult.gas || rpcResult.gasLimit),
      toBuffer(rpcResult.to),
      toBuffer(rpcResult.value),
      toBuffer(rpcResult.input || rpcResult.data),
      toBuffer(rpcResult.v),
      toBuffer(rpcResult.r),
      toBuffer(rpcResult.s)
    ])
  }
}

module.exports = Transaction
