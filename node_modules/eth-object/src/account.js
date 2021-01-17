const { keccak, encode, decode, toBuffer } = require('eth-util-lite')
const EthObject = require('./ethObject')

class Account extends EthObject{

  static get fields(){ return ['nonce', 'balance', 'storageRoot', 'codeHash'] }
  static get NULL(){ return new Account([toBuffer(), toBuffer(), keccak(encode()), keccak()]) }

  constructor(raw = Account.NULL){
    super(Account.fields, raw)
  }

  static fromBuffer(buf){ return buf ? new Account(decode(buf)) : new Account() }
  static fromHex(hex){ return hex ? new Account(decode(hex)) : new Account() }
  static fromRaw(raw){ return new Account(raw) }
  static fromObject(rpcResult){ return Account.fromRpc(rpcResult) }
  static fromRpc(rpcResult){
    if(rpcResult){
      return new Account([
        toBuffer(rpcResult.nonce),
        toBuffer(rpcResult.balance),
        toBuffer(rpcResult.storageHash || rpcResult.storageRoot || keccak(encode())),
        toBuffer(rpcResult.codeHash || rpcResult.codeRoot || keccak())
      ])
    }else{
      return new Account()
    }
  }
}

module.exports = Account
