const { decode, toBuffer } = require('eth-util-lite')
const EthObject = require('./ethObject')
const Log = require('./log')

class Receipt extends EthObject{

  static get fields(){ return [
    'postTransactionState',
    'cumulativeGasUsed',
    'bloomFilter',
    'setOfLogs'
  ] }

  constructor(raw = Receipt.NULL){
    super(Receipt.fields, raw)
  }

  static fromBuffer(buf){ return buf ? new Receipt(decode(buf)) : new Receipt() }
  static fromHex(hex){ return hex ? new Receipt(decode(hex)) : new Receipt() }
  static fromRaw(raw){ return new Receipt(raw) }
  static fromObject(rpcResult){ return Receipt.fromRpc(rpcResult) }
  static fromRpc(rpcResult){
    let logs = []
    for (var i = 0; i < rpcResult.logs.length; i++) {
       logs.push(Log.fromRpc(rpcResult.logs[i]))
    }
    return new Receipt([
      toBuffer(rpcResult.status || rpcResult.root),
      toBuffer(rpcResult.cumulativeGasUsed),
      toBuffer(rpcResult.logsBloom),
      logs
    ])
  }
}

module.exports = Receipt
