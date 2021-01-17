# EthObject

Trying to serialize Ethereum Trie / LevelDB data from hex, buffers and rpc into the same format is tough. This library aims to solve that with re-usable and composable objects that you can just call Object.from<X> to ingest new data.

EthObjects hold Ethereum bare bones data with lots of helper functions for viewing and moving them in and out of other popular formats.

```
npm install eth-object
```

The following objects are supported:

```javascript
const { Account, Header, Log, Proof, Receipt, Transaction } = require('eth-object')
```

## Formating

The data formats used/returned for account, `header`, `log`, `proof`, `receipt`, and `transaction` are `eth-object`s. They mimic the native Ethereum format of being _arrays of byteArrays and nested arrays (of the same)_. This is the format you would find in the native database after being rlp-decoded.

An account, for example, will look like this:

```javascript
// [
//   <Buffer 01>,
//   <Buffer >,
//   <Buffer c1 49 53 a6 4f 69 63 26 19 63 6f bd f3 27 e8 83 43 6b 9f d1 b1 02 52 20 e5 0f b7 0a b7 d2 e2 a8>,
//   <Buffer f7 cf 62 32 b8 d6 55 b9 22 68 b3 56 53 25 e8 89 7f 2f 82 d6 5a 4e aa f4 e7 8f ce f0 4e 8f ee 6a>,
// ]
```

Its a 4-item array of _bytearrays_ representing the _nonce, balance, storageRoot, and codeHash_ respectively. 

But they not just simple arrays that do this:

```javascript
console.log(account[0]) // => <buffer 01>
```

They also have helper methods for:

- The object's named fields property:

```javascript
console.log(account.nonce) // => <buffer 01>
```

- Conversion to printable formats

```javascript
console.log(account.toJson())
// {
//   "nonce":"0x01",
//   "balance":"0x",
//   "storageRoot":"0xc14953a64f69632619636fbdf327e883436b9fd1b1025220e50fb70ab7d2e2a8",
//   "codeHash":"0xf7cf6232b8d655b92268b3565325e8897f2f82d65a4eaaf4e78fcef04e8fee6a"
// }
```

- Conversion to the native bytes:

```javascript
console.log(account.buffer) // native format (used to calculate hashes and roots)
// <Buffer f8 44 01 80 a0 c1 49 53 a6 4f 69 63 26 19 63 6f bd f3 27 e8 83 43 6b 9f d1 b1 02 52 20 e5 0f b7 0a b7 d2 e2 a8 a0 f7 cf 62 32 b8 d6 55 b9 22 68 b3 56 ... >
```

- A text-pastable version of the bytes

```javascript
console.log(account.hex) // rlp encoded bytes as a hex string
// "0xf8440180a0c14953a64f69632619636fbdf327e883436b9fd1b1025220e50fb70ab7d2e2a8a0f7cf6232b8d655b92268b3565325e8897f2f82d65a4eaaf4e78fcef04e8fee6a"
```

And they can be created from a direct RPC result or any other format that you may find yourself with:

```javascript
Account.fromRpc(rpcResult)
Account.fromHex(hexString)
Account.fromBuffer(Bytes)
Account.fromRaw(nativeArray)
```

