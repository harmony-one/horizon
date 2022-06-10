/* eslint-disable node/no-unpublished-import */
import { ethers } from 'ethers'
import { promisify } from 'util'
import { BaseTrie as Trie } from 'merkle-patricia-tree'
import { GetProof } from 'eth-proof'

function buffer2hex(buffer) {
  return '0x' + buffer.toString('hex')
}

async function rpcWrapper(hash, isTxn, callback, args) {
  const provider = new ethers.providers.JsonRpcProvider(args[0])
  // let web3 = new Web3(new Web3.providers.HttpProvider(args[0]));
  let receipt
  if (isTxn) {
    receipt = await provider.getTransactionReceipt(hash)
  } else {
    receipt = await provider.getBlock(hash)
  }
  const sendRpc = promisify(provider.send).bind(provider)
  const response = await sendRpc({
    jsonrpc: '2.0',
    method: 'hmyv2_getFullHeader',
    params: [receipt.blockNumber],
    id: new Date().getTime()
  })
  const header = toRLPHeader(response.result)
  const result = await callback(...args, header)
  return result
}

function toRLPHeader(block) {
  return ethers.utils.RLP.encode([
    ethers.utils.hexlify(ethers.utils.toUtf8Bytes('HmnyTgd')),
    ethers.utils.hexlify(ethers.utils.toUtf8Bytes('v4')),
    [
      block.parentHash,
      block.miner,
      block.stateRoot,
      block.transactionsRoot,
      block.receiptsRoot,
      block.outgoingReceiptsRoot,
      block.incomingReceiptsRoot,
      block.logsBloom,
      ethers.BigNumber.from(block.number).toHexString(),
      ethers.utils.hexlify(block.gasLimit),
      ethers.utils.hexlify(block.gasUsed),
      ethers.BigNumber.from(block.timestamp).toHexString(),
      block.extraData,
      block.mixHash,
      ethers.BigNumber.from(block.viewID).toHexString(),
      ethers.BigNumber.from(block.epoch).toHexString(),
      ethers.utils.hexlify(block.shardID),
      block.lastCommitSignature,
      block.lastCommitBitmap,
      block.vrf,
      block.vdf,
      block.shardState,
      block.crossLink,
      block.slashes,
      block.mmrRoot
    ]
  ])
}

function getReceiptLight(receipt) {
  return {
    status: receipt.status ? 1 : 0,
    gasUsed: receipt.gasUsed,
    logsBloom: receipt.logsBloom,
    logs: receipt.logs
  }
}

function getReceipt(receipt) {
  // const receiptData = {
  //     transactionHash: receipt.transactionHash,
  //     transactionIndex: receipt.transactionIndex,
  //     blockHash: receipt.blockHash,
  //     blockNumber: receipt.blockNumber,
  //     from: receipt.from,
  //     to: receipt.to,
  //     gasUsed: receipt.gasUsed,
  //     cummulativeGasUsed: receipt.cummulativeGasUsed,
  //     contractAddress: receipt.contractAddress,
  //     // bloom: receipt.logsBloom,
  //     // status: receipt.status,
  //     // v: receipt.v,
  //     // r: receipt.r,
  //     // s: receipt.s,
  //     // logs: receipt.logs,
  // }
  const receiptData = {
    status: receipt.status ? 1 : 0,
    gasUsed: receipt.gasUsed,
    bloom: receipt.logsBloom,
    logs: receipt.logs
  }
  return receiptData
}

function getReceiptRlp(receipt) {
  return ethers.utils.RLP.encode(Object.values(getReceipt(receipt)))
}

async function getReceiptTrie(receipts) {
  const receiptTrie = new Trie()
  for (let txIdx = 0; txIdx < receipts.length; txIdx++) {
    await receiptTrie.put(
      Buffer.from(ethers.utils.RLP.encode(txIdx), 'utf-8'),
      Buffer.from(getReceiptRlp(receipts[txIdx]), 'utf-8')
    )
  }
  return receiptTrie
}

function hex2key(hexkey, proofLength) {
  const actualkey = []
  const encoded = buffer2hex(ethers.utils.RLP.encode(hexkey)).slice(2)
  const key = [...new Array(encoded.length / 2).keys()].map((i) =>
    parseInt(encoded[i * 2] + encoded[i * 2 + 1], 16)
  )

  key.forEach((val) => {
    if (actualkey.length + 1 === proofLength) {
      actualkey.push(val)
    } else {
      actualkey.push(Math.floor(val / 16))
      actualkey.push(val % 16)
    }
  })
  return '0x' + actualkey.map((v) => v.toString(16).padStart(2, '0')).join('')
}

function index2key(index, proofLength) {
  const actualkey = []
  const encoded = buffer2hex(ethers.utils.RLP.encode(index)).slice(2)
  const key = [...new Array(encoded.length / 2).keys()].map((i) =>
    parseInt(encoded[i * 2] + encoded[i * 2 + 1], 16)
  )

  key.forEach((val) => {
    if (actualkey.length + 1 === proofLength) {
      actualkey.push(val)
    } else {
      actualkey.push(Math.floor(val / 16))
      actualkey.push(val % 16)
    }
  })
  return '0x' + actualkey.map(v => v.toString(16).padStart(2, '0')).join('')
}

function expandkey(hexvalue) {
  if (hexvalue.substring(0, 2) === '0x') hexvalue = hexvalue.substring(2)
  return [...new Array(hexvalue.length).keys()]
    .map((i) => '0' + hexvalue[i])
    .join('')
}

async function getTransactionProof(getProof, prover, txhash, fullHeader) {
  if (typeof getProof === 'string') getProof = new GetProof(getProof)
  const proof = await _getTransactionProof(getProof, txhash)
  proof.headerData = fullHeader
  const proofData = proof.proof.map((node) =>
    buffer2hex(ethers.utils.RLP.encode(node))
  )
  const block = await prover.toBlockHeader(proof.headerData)
  return {
    expectedRoot: block.transactionsRoot,
    key: index2key(proof.receiptIndex, proof.proof.length),
    proof: proofData,
    keyIndex: proof.keyIndex,
    proofIndex: proof.proofIndex,
    expectedValue: proof.receiptData,
    header: block
  }
}

async function getReceiptProof(getProof, prover, txhash, fullHeader) {
  if (typeof getProof === 'string') getProof = new GetProof(getProof)
  const proof = await _getReceiptProof(getProof, txhash)
  proof.headerData = fullHeader
  const proofData = proof.proof.map((node) =>
    buffer2hex(ethers.utils.RLP.encode(node))
  )
  const block = await prover.toBlockHeader(proof.headerData)
  // console.log(block);
  return {
    expectedRoot: block.receiptsRoot,
    key: index2key(proof.receiptIndex, proof.proof.length),
    proof: proofData,
    keyIndex: proof.keyIndex,
    proofIndex: proof.proofIndex,
    expectedValue: proof.receiptData,
    header: block
  }
}

async function _getTransactionProof(getProof, txhash) {
  const proof = await getProof.transactionProof(txhash)
  const data = [...proof.txProof].map((node) =>
    node.map((elem) => buffer2hex(elem))
  )
  return {
    receiptIndex: parseInt(proof.txIndex.slice(2), 16),
    keyIndex: 0,
    proofIndex: 0,
    receiptData: data[data.length - 1][1],
    proof: data,
    headerData: proof.header.toHex()
  }
}

async function _getReceiptProof(getProof, txhash) {
  const proof = await getProof.receiptProof(txhash)
  const receiptProof = [...proof.receiptProof].map((node) =>
    node.map((elem) => buffer2hex(elem))
  )
  return {
    receiptIndex: parseInt(proof.txIndex.slice(2), 16),
    keyIndex: 0,
    proofIndex: 0,
    receiptData: receiptProof[receiptProof.length - 1][1],
    proof: receiptProof,
    headerData: proof.header.toHex()
  }
}

async function _getAccountProof(getProof, address, blockHash) {
  const proof = await getProof.accountProof(address, blockHash)
  const accountProof = [...proof.accountProof].map((node) =>
    node.map((elem) => buffer2hex(elem))
  )
  return {
    keyIndex: 0,
    proofIndex: 0,
    receiptData: accountProof[accountProof.length - 1],
    proof: accountProof,
    headerData: proof.header.toHex()
  }
}

async function getAccountProof(
  web3,
  getProof,
  prover,
  address,
  blockHash,
  fullHeader
) {
  if (typeof getProof === 'string') getProof = new GetProof(getProof)
  const proof = await _getAccountProof(getProof, address, blockHash)
  proof.headerData = fullHeader
  const proofData = proof.proof.map((node) =>
    buffer2hex(ethers.utils.RLP.encode(node))
  )
  const block = await prover.toBlockHeader(proof.headerData)
  return {
    expectedRoot: block.stateRoot,
    key: '0x' + expandkey(web3.utils.soliditySha3(address)),
    proof: proofData,
    keyIndex: proof.keyIndex,
    proofIndex: proof.proofIndex,
    expectedValue: proof.receiptData[1],
    header: block
  }
}

async function _getStorageProof(getProof, address, storageAddress, blockHash) {
  const proof = await getProof.storageProof(address, storageAddress, blockHash)
  const accountProof = [...proof.accountProof].map((node) =>
    node.map((elem) => buffer2hex(elem))
  )
  return {
    keyIndex: 0,
    proofIndex: 0,
    receiptData: accountProof[accountProof.length - 1],
    proof: accountProof,
    headerData: proof.header.toHex()
  }
}

async function getStorageProof(
  getProof,
  prover,
  address,
  storageAddress,
  blockHash,
  fullHeader
) {
  if (typeof getProof === 'string') getProof = new GetProof(getProof)
  const proof = await _getStorageProof(
    getProof,
    address,
    storageAddress,
    blockHash
  )
  proof.headerData = fullHeader
  const proofData = proof.proof.map((node) =>
    buffer2hex(ethers.utils.RLP.encode(node))
  )
  const block = await prover.toBlockHeader(proof.headerData)
  return {
    expectedRoot: block.stateRoot,
    // key: index2key(web3.utils.soliditySha3(address)),
    key: '0x' + expandkey(storageAddress),
    proof: proofData,
    keyIndex: proof.keyIndex,
    proofIndex: proof.proofIndex,
    expectedValue: proof.receiptData[1],
    header: block
  }
}

function getKeyFromProof(proof) {
  if (proof.length <= 1) return ''
  const node = proof[proof.length - 1]
  //   const hash = web3.utils.soliditySha3(node);
  const hash = ethers.utils.keccak256(node)
  const decodedPrevNode = ethers.utils.RLP.decode(proof[proof.length - 2]).map(
    buffer2hex
  )
  const index = decodedPrevNode.findIndex((value) => value === hash)
  proof.pop()
  return getKeyFromProof(proof) + index.toString(16).padStart(2, '0')
}

function fullToMin(header) {
  const {
    hash,
    parentHash,
    difficulty,
    number,
    gasLimit,
    gasUsed,
    timestamp,
    totalDifficulty
  } = header
  return {
    hash,
    parentHash,
    difficulty,
    number,
    gasLimit,
    gasUsed,
    timestamp,
    totalDifficulty
  }
}

// module.exports = {
export {
  buffer2hex,
  rpcWrapper,
  toRLPHeader,
  getReceiptLight,
  getReceipt,
  getReceiptRlp,
  getReceiptTrie,
  hex2key,
  index2key,
  expandkey,
  getReceiptProof,
  getTransactionProof,
  getAccountProof,
  getStorageProof,
  getKeyFromProof,
  fullToMin
}
