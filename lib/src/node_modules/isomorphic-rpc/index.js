const fetch = require('isomorphic-fetch')

class IsoRpc{
  constructor(provider = "http://localhost:8545", fetchOptions = {}){
    this.provider = provider
    this.id = 1
    this.fetchOptions = fetchOptions
  }
  static get(obj,prop){
    if(prop in obj){
      return obj[prop]
    }else{
      return async(...params) => {
        let connection = await fetch(obj.provider, Object.assign({
          method: "POST",
          headers: {"Content-Type": "application/json", "Accept": "application/json"},
          body: JSON.stringify({
            jsonrpc:"2.0",
            method:prop,
            params:params,
            id:obj.id++
          })
        },obj.fetchOptions)).catch()

        let response = await connection.json()

        if (response.error) {
          throw new Error(response.error)
        }else{
          return response.result
        }
      }
    }
  }
}

module.exports = function Rpc(provider, fetchOptions){
  return new Proxy(new IsoRpc(provider, fetchOptions),IsoRpc)
}
