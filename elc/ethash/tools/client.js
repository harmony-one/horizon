const ClientSol = artifacts.require("Client");
const MerkleProof = artifacts.require("MerkleProof");
const Prime = artifacts.require("Prime");
const Keccak512 = artifacts.require("Keccak512");
const Ethash = require('@ethereumjs/ethash');
const EthashUtil = require('@ethereumjs/ethash/dist/util');
const Web3Eth = require('web3-eth');
const { BlockHeader } = require('@ethereumjs/block');
const { BN,TWO_POW256 } = require('ethereumjs-util');
const { MerkleTree, getProof } = require("./merkel.js");
const fs = require('fs');

const EthUrl='https://mainnet.infura.io/v3/ef2ba412bbaf499191f98908f9229490';
const eth = new Web3Eth(EthUrl);

const D = console.log;

async function EthashTest(rlpParentHeader, rlpheader, cache, fullSize, proofs) {
    const keccak512Sol = await Keccak512.new();
    ClientSol.link('Keccak512', keccak512Sol.address);
    const merkelSol = await MerkleProof.new();
    ClientSol.link('MerkleProof', merkelSol.address);
    const primeSol = await Prime.new();
    ClientSol.link('Prime', primeSol.address);
    const clientSol = await ClientSol.new(rlpParentHeader);
    D(clientSol.address);
    D("root:", proofs.root, proofs.proofs.length)
    //const _result = await clientSol.addBlockHeader.sendTransaction(rlpheader, cache, proofs.proofs, {gas:8000000});
    //D(_result);
    const result = await clientSol.addBlockHeader.call(rlpheader, cache, proofs.proofs, {gas:8000000});
    return result;
}

function fromRPC(blockParams){
    const {
        parentHash,
        sha3Uncles,
        miner,
        stateRoot,
        transactionsRoot,
        receiptRoot,
        receiptsRoot,
        logsBloom,
        difficulty,
        number,
        gasLimit,
        gasUsed,
        timestamp,
        extraData,
        mixHash,
        nonce,
    } = blockParams
    
    return BlockHeader.fromHeaderData({
        parentHash,
        uncleHash: sha3Uncles,
        coinbase: miner,
        stateRoot,
        transactionsTrie: transactionsRoot,
        receiptTrie: receiptRoot || receiptsRoot,
        bloom: logsBloom,
        difficulty:web3.utils.toHex(difficulty),
        number:web3.utils.toHex(number),
        gasLimit: web3.utils.toHex(gasLimit),
        gasUsed:web3.utils.toHex(gasUsed),
        timestamp:web3.utils.toHex(timestamp),
        extraData,
        mixHash,
        nonce,
    });
}

function verifyHeader(ethash, header, fullSize) {
    const headerHash = ethash.headerHash(header.raw())
    const { difficulty, mixHash, nonce } = header
    const a = ethash.run(headerHash, nonce, fullSize)
    const result = new BN(a.hash)
    if (!(a.mix.equals(mixHash) && TWO_POW256.div(difficulty).cmp(result) === 1)) throw "ethash local wrong!";
    D("verifyHeader:", TWO_POW256.div(difficulty), result, difficulty);
    return a;
}

function writeCache(cache){
    const fcache = cache.map(val=>val.toString('hex'));
    fs.writeFileSync("./cache", JSON.stringify(fcache));
}

function loadCache() {
    if(!fs.existsSync("./cache")) return undefined;
    const data = fs.readFileSync("cache");
    const fcache = JSON.parse(data);
    return fcache.map(el=>Buffer.from(el, 'hex'));
}

async function main() {
    const blockNo = 11601333;//await eth.getBlockNumber();
    const parentBlock = await eth.getBlock(blockNo-1);
    const block = await eth.getBlock(blockNo);
    //block.transactions = undefined;
    //parentBlock.transactions = undefined;
    const parentHeader = fromRPC(parentBlock);
    const header = fromRPC(block);

    const ethash = new Ethash.default();
    const epoch = EthashUtil.getEpoc(header.number);
    const cacheSize = EthashUtil.getCacheSize(epoch);
    const fullSize = EthashUtil.getFullSize(epoch);
    const seed = EthashUtil.getSeed(Buffer.alloc(32), 0, epoch);
    //const ethash = merkel.ethash;
    D("make cache...")
    ethash.cache = loadCache();
    if(!ethash.cache){
        ethash.mkcache(cacheSize, seed);
        writeCache(ethash.cache);
    }
    D("cacheSize:", cacheSize, "fullSize:", fullSize);
    const result = verifyHeader(ethash, header, fullSize);
    const merkel = new MerkleTree(`tredb-index-${fullSize}.db`,seed, cacheSize, fullSize, ethash);
    const proofs = getProof(merkel, header, result.indexes.filter((_,i)=>i&1^1));
    const cacheU32 = [];
    for(let i = 0; i < result.indexes.length/2; i++){
        const data1 = ethash.calcDatasetItem(result.indexes[2*i], []);
        const data2 = ethash.calcDatasetItem(result.indexes[2*i+1], []);
        cacheU32.push([
            data1.slice(0,32),data1.slice(32,64),
            data2.slice(0,32),data2.slice(32,64),
        ]);
    }
    D("cache32Size:", cacheU32.length, proofs.proofs[1].length);
    const rlpParentHeader = parentHeader.serialize();
    const rlpHeader = header.serialize();
    const resultSol = await EthashTest(rlpParentHeader, rlpHeader, cacheU32, fullSize, proofs);
    D(resultSol);
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
