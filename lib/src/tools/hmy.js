const EthBridge = require('../lib/EthBridge');
const testProverAddr = require("../misc/test.json").ProvethVerifier;
const abiJson = require("../misc/test_abi.json");
const rlp = require('rlp');
const { Proof, Header, Receipt } = require('eth-object');
const { BaseTrie } = require('merkle-patricia-tree');
const { toHex, toBuffer, encode } = require('eth-util-lite');
const Rpc  = require('isomorphic-rpc');
require("dotenv").config({path: './envs/eth.env'});
const { promisfy } = require('promisfy')
const {GetProof} = require('eth-proof');
const Buffer = require('buffer').Buffer

const txHash = process.argv[2];
const ETH_NODE_URL = "http://127.0.0.1:8545";
const eb = new EthBridge()
eb.gp = new GetProof(ETH_NODE_URL)
const web3 = eb.web3
const rpc = new Rpc(ETH_NODE_URL)

async function getReceiptsByTxHash(txns) {
    let promises = []
    for (let tx of txns) {
        promises.push( rpc.eth_getTransactionReceipt(tx) )
    }
    return Promise.all(promises)
}

async function makeReceiptTrie(txHash){
    let targetReceipt = await rpc.eth_getTransactionReceipt(txHash)

    let rpcBlock = await rpc.eth_getBlockByHash(targetReceipt.blockHash, false)

    let rpcReceipts = await getReceiptsByTxHash(rpcBlock.transactions)

    let trie = new BaseTrie();
    console.log("size", rpcReceipts.length)
    for (let receipt of rpcReceipts) {
        let key = encode(web3.utils.hexToNumber(receipt.transactionIndex))
        let val = Receipt.fromRpc(receipt).serialize()
        // console.log(key.toString('hex'))
        // console.log(val.toString('hex'))
        await trie.put(key, val)
    }
    console.log("exp root: ", rpcBlock.receiptsRoot)
    console.log("got root: ", web3.utils.bytesToHex(trie.root))

    // let targetKey = encode(web3.utils.hexToNumber(targetReceipt.transactionIndex))
    // let proof = await BaseTrie.createProof(trie, targetKey)

    return {
        root: web3.utils.bytesToHex(Header.fromRpc(rpcBlock).receiptRoot),
        proof: Proof.fromStack(stack),
        txIndex: targetReceipt.transactionIndex
    }
}

(async function() {

    try {
        // let resp = await eb.gp.receiptProof(txHash)
        // let root = web3.utils.bytesToHex(resp.header.receiptRoot)
        // let proof = encode(resp.receiptProof).toString('hex')
        // let key = resp.txIndex

        let resp = await eb.gp.receiptProof(txHash)
        let root = resp.header.receiptRoot
        let proof = encode(resp.receiptProof)
        let key = encode(parseInt(resp.txIndex))

        let rootHex = '0x'+root.toString('hex');
        let keyHex = '0x'+key.toString('hex')
        let proofHex = '0x'+proof.toString('hex')
        console.log(JSON.stringify([rootHex,rootHex, keyHex, proofHex]))


        // let testProver = new eb.web3.eth.Contract(abiJson.abi, testProverAddr)
        // let response = await testProver.methods.MPTProof(root, key, proof).call({gasLimit: 4712388})

        // let resp = await eb.gp.receiptProof(txHash)
        //
        // let receiptHash = web3.utils.bytesToHex(resp.header.receiptRoot)
        //
        // let receiptRoot = web3.utils.bytesToHex(resp.header.receiptRoot)
        // let key = resp.txIndex
        // let receiptProof = web3.utils.bytesToHex(rlp.encode(resp.receiptProof))
        //

    } catch (e) {
        console.log(e)
    }
} ()).catch( err => console.log ).finally(() => process.exit())
