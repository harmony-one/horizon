const { encode, toHex } = require('eth-util-lite')

class EthObject extends Array{

  constructor(fields, raw){
//raw array
    super(...raw)

// properties
    fields.forEach((field, i)=>{
      Object.defineProperty(this, field, {
        value: this[i],
        writable: false
      });
    })

    Object.defineProperty(this, 'fields', {
      value: fields,
      writable: false
    });

// methods
    Object.defineProperty(this, 'buffer', {
      get: function(){ return encode(this.raw) },
    });
    Object.defineProperty(this, 'hex', {
      get: function(){ return toHex(this.buffer) },
    });
    Object.defineProperty(this, 'raw', {
      get: function(){ 
        return this.fields.map((field, i)=>{ return this[i] })
      },
    });
    Object.defineProperty(this, 'object', {
      get: function(){
        let obj = {}
        this.fields.forEach((field, index)=>{
          if(this[index] instanceof Array){
            obj[field] = this[index] 
          }else{
            obj[field] = toHex(this[index])   
          }
        })
        return obj
      },
    });
    Object.defineProperty(this, 'json', {
      get: function(){ return JSON.stringify(this.object) },
    });
  }

// aliases
  serialize(){ return this.buffer }
  toBuffer() { return this.buffer }
  toHex(){     return this.hex }
  toObject(){  return this.object }
  toString(){  return this.json }
  toJson(){    return this.json }
}

module.exports = EthObject
