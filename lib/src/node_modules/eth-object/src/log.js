const {decode, toBuffer } = require('eth-util-lite')
const EthObject = require('./ethObject')

class Log extends EthObject{

  static get fields(){ return ['address', 'topics', 'data'] }

  constructor(raw = Log.NULL){
    super(Log.fields, raw)
  }

  static fromBuffer(buf){ return buf ? new Log(decode(buf)) : new Log() }
  static fromHex(hex){ return hex ? new Log(decode(hex)) : new Log() }
  static fromRaw(raw){ return new Log(raw) }
  static fromObject(rpcResult){ return Log.fromRpc(rpcResult) }
  static fromRpc(rpcResult){
    let topics = []
  //.map
    for (var i = 0; i < rpcResult.topics.length; i++) {
      topics.push(toBuffer(rpcResult.topics[i]))
    }
    return new Log([
      toBuffer(rpcResult.address),
      topics,
      toBuffer(rpcResult.data)
    ])
  }
}

module.exports = Log
