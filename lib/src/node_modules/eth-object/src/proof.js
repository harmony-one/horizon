const { keccak, encode, decode, toHex } = require('eth-util-lite')
const EthObject = require('./ethObject')

class Proof extends EthObject{

  static get fields(){ return ['rootNode'] }
  static get NULL(){ return new Proof([encode()]) }

  constructor(raw = Proof.NULL){
    let hashes = raw.map((nodeValue)=>{ return toHex(keccak(encode(nodeValue))) })
    super(hashes, raw)
  }

  static fromBuffer(buf){ return buf ? new Proof(decode(buf)) : new Proof() }
  static fromHex(hex){ return hex ? new Proof(decode(hex)) : new Proof() }
  static fromRaw(raw){ return new Proof(raw) }
  static fromObject(rpcProof){ return Proof.fromRpc(rpcProof) }
  static fromRpc(rpcProof){
    if(rpcProof){
      let arrayProof = rpcProof.map((stringNode)=>{
        return decode(stringNode)
      })
      return new Proof(arrayProof)
    }
  }
  static fromStack(stack){ 
    let arrayProof = stack.map((trieNode)=>{ return trieNode.raw })
    return new Proof(arrayProof)
  }
}

module.exports = Proof
