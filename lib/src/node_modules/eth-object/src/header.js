const { decode, toBuffer, KECCAK256_RLP_ARRAY, KECCAK256_NULL } = require('eth-util-lite')
const EthObject = require('./ethObject')

class Header extends EthObject{

  static get fields(){ return [
    'parentHash',
    'sha3Uncles',
    'miner',
    'stateRoot',
    'transactionsRoot',
    'receiptRoot',
    'logsBloom',
    'difficulty',
    'number',
    'gasLimit',
    'gasUsed',
    'timestamp',
    'extraData',
    'mixHash',
    'nonce',
  ]}

  constructor(raw = this.NULL){
    super(Header.fields, raw)
  }

  static fromBuffer(buf){ return buf ? new this(decode(buf)) : new this() }
  static fromHex(hex){ return hex ? new this(decode(hex)) : new this() }
  static fromRaw(raw){ return new this(raw) }
  static fromObject(rpcResult){ return this.fromRpc(rpcResult) }
  static fromRpc(rpcResult){
    if(rpcResult){
      return new this([
        toBuffer(rpcResult.parentHash),
        toBuffer(rpcResult.sha3Uncles) || KECCAK256_RLP_ARRAY,
        toBuffer(rpcResult.miner),
        toBuffer(rpcResult.stateRoot) || KECCAK256_NULL,
        toBuffer(rpcResult.transactionsRoot) || KECCAK256_NULL,
        toBuffer(rpcResult.receiptsRoot) || toBuffer(rpcResult.receiptRoot) || KECCAK256_NULL,
        toBuffer(rpcResult.logsBloom),
        toBuffer(rpcResult.difficulty),
        toBuffer(rpcResult.number),
        toBuffer(rpcResult.gasLimit),
        toBuffer(rpcResult.gasUsed),
        toBuffer(rpcResult.timestamp),
        toBuffer(rpcResult.extraData),
        toBuffer(rpcResult.mixHash),
        toBuffer(rpcResult.nonce)
      ])
    }else{
      return new this()
    }
  }
}

module.exports = Header
