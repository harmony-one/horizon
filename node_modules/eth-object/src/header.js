const { decode, toBuffer, KECCAK256_RLP_ARRAY, KECCAK256_NULL } = require('eth-util-lite')
const EthObject = require('./ethObject')
const utils = require('ethereumjs-util')
const web3 = require('web3')

class Header extends EthObject {

  static get fields() {
    return [
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
    ]
  }

  constructor(raw = this.NULL) {
    super(Header.fields, raw)
  }

  static fromBuffer(buf) { return buf ? new this(decode(buf)) : new this() }
  static fromHex(hex) { return hex ? new this(decode(hex)) : new this() }
  static fromRaw(raw) { return new this(raw) }
  static fromObject(rpcResult) { return this.fromRpc(rpcResult) }
  static fromRpc(rpcResult) {
    if (rpcResult) {
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
    } else {
      return new this()
    }
  }

  static fromWeb3(web3Result) {
    let rpcResult = Object.assign({}, web3Result)
    rpcResult.difficulty = web3.utils.toHex(rpcResult.difficulty)
    rpcResult.number = web3.utils.toHex(rpcResult.number)
    rpcResult.gasLimit = web3.utils.toHex(rpcResult.gasLimit)
    rpcResult.gasUsed = web3.utils.toHex(rpcResult.gasUsed)
    rpcResult.timestamp = web3.utils.toHex(rpcResult.timestamp)
    return this.fromRpc(rpcResult)
  }
}

module.exports = Header
