const { MerkelDB } = require('./MmapDB.js');
const { Keccak } = require('sha3');
const Ethash = require('@ethereumjs/ethash');
const EthashUtil = require('@ethereumjs/ethash/dist/util');

const Web3Eth = require('web3-eth');
const { BlockHeader } = require('@ethereumjs/block');
const { BN,TWO_POW256 } = require('ethereumjs-util');

const EthUrl='https://mainnet.infura.io/v3/ef2ba412bbaf499191f98908f9229490';
const eth = new Web3Eth(EthUrl);

const D = console.log;

function sha3(str) {
    const hash = new Keccak(256);
    hash.update(str);
    return hash.digest();
}

class MetaInfo {
  MAGIC="DAGPROOF"
  constructor(buf){
    this.buf = buf;
    this.load();
  }
  load() {
    const buf = this.buf;
    const magic = buf.slice(0, 8);
    if(magic.toString() == this.MAGIC){
      const jsonSize = buf.slice(8, 16).readUInt32LE();
      this.header = JSON.parse(buf.slice(16, 16+jsonSize));
    }
  }
  save() {
    const buf = this.buf;
    if(!this.header) throw "wrong";
    const jsonStr = JSON.stringify(this.header);
    if(jsonStr.length > 4080) throw "too long";
    buf.slice(16).write(jsonStr);
    buf.slice(8,16).writeUInt32LE(jsonStr.length);
    buf.slice(0, 8).write(this.MAGIC);
  }
}

class MerkleTree {
    ELEM_SIZE=128;
    constructor(name, seed, cacheSize, fullSize, ethash){
      const dag = {seed, cacheSize, fullSize}
      this.treedb = new MerkelDB(name);
      const header = this.treedb.header();
      const meta = new MetaInfo(header);
      if(meta.header) {
        dag.seed = Buffer.from(meta.header.dag.seed, 'hex');
        dag.cacheSize = meta.header.dag.cacheSize;
        dag.fullSize = meta.header.dag.fullSize;
      }

      const layersNum = [dag.fullSize/this.ELEM_SIZE];
      while(layersNum[0] > 1) {
        const size = layersNum[0];
        layersNum.unshift(Math.ceil(size/2))
      }
      this.treedb.init(layersNum);

      //const ethash = new Ethash.default();
      //D("mkcache...")
      //ethash.mkcache(dag.cacheSize, dag.seed);
      //D("mkcache done")
      if(!meta.header) {
        D("init database")
        const depth = layersNum.length;
        D("depth:", depth);
        const leafLayer = this.treedb.getLayer(depth-1);
        let startTime = Date.now();
        const LoopN = dag.fullSize/this.ELEM_SIZE;
        //console.warn("skip some data, just for debug")
        for(let i = 0; i < LoopN; i++){
          if(i % 128 == 0 && Date.now() - startTime > 10000){ D("leafLayer", i); startTime = Date.now();}
          const buf1 = ethash.calcDatasetItem(2*i, []);
          const buf2 = ethash.calcDatasetItem(2*i+1, []);
          const bufIndex = Buffer.alloc(32);
          bufIndex.writeUInt32BE(2*i, 28);
          const elem = sha3(Buffer.concat([bufIndex, buf1, buf2]));
          const elemSlice = this.treedb.getElem(leafLayer, i);
          elem.copy(elemSlice);
        }
        this.getLayers(leafLayer, depth-1);
        meta.header = {
          dag:{
            seed: seed.toString('hex'),
            cacheSize,
            fullSize
          }
        }
        meta.save();
      }
      this.ethash = ethash;
      this.layers = [...this.treedb.getLayers()].reverse(); // leafLayer...rootLayer
      return;
      this.layers.forEach((val, idx)=>{
        D("layers:", idx, val.length, val.reduce((a,b)=>a+b.length, 0));
      })
    }
  
    getLayers (elements, depth) {
      if (elements.length === 0) {
        return [['']];
      }
  
      //const layers = [];
      //layers.push(elements);
  
      // Get next layer until we reach the root
      let lowLayer = elements;
      while (depth > 0) {
        const layer = this.treedb.getLayer(--depth);
        D(depth, layer.elemsNums);
        lowLayer = this.getNextLayer(lowLayer, layer);
      }
    }
  
    getNextLayer (elements, layer) {
      let startTime = Date.now();
      for(let i = 0; i < layer.elemsNums; i+=2){
        if(i % 128 == 0 && Date.now() - startTime > 10000){ D("NextLayer", i, layer.elemsNums); startTime = Date.now();}
        const elem1 = this.treedb.getElem(elements, i);
        const elem2 = i+1 < layer.elemsNums ? this.treedb.getElem(elements, i+1) : undefined;
        const elemHash = this.combinedHash(elem1, elem2);
        const nextIndex = Math.floor(i/2);
        const targetSlice = this.treedb.getElem(layer, nextIndex);
        elemHash.copy(targetSlice);
      }
      return layer;
    }
  
    combinedHash (first, second) {
      if (!first) { return second; }
      if (!second) { return first; }
      return sha3(this.sortAndConcat(first, second));
    }
  
    getRoot () { // --
      //return this.layers[this.layers.length - 1][0];
      const layer = this.layers[this.layers.length - 1];
      return this.treedb.getElem(layer, 0);
    }
  
    getHexRoot () { // --
      return `0x${this.getRoot().toString('hex')}`
    }
  
    getProof (idx) { // --
      //let idx = this.bufIndexOf(el, this.elements);
  
      if (idx === -1) {
        throw new Error('Element does not exist in Merkle tree');
      }
      return this.layers.reduce((proof, layer) => {
        const pairElement = this.getPairElement(idx, layer);
  
        if (pairElement) {
          proof.push(pairElement);
        }
  
        idx = Math.floor(idx / 2);
  
        return proof;
      }, []);
    }
  
    getHexProof (idx) { // --
      const proof = this.getProof(idx);
  
      return this.bufArrToHexArr(proof);
    }
  
    getPairElement (idx, layer) {
      const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      return pairIdx < layer.elemsNums ? this.treedb.getElem(layer, pairIdx) : undefined;
      const elem = this.treedb.getElem(layer, pairIdx);
      if(elem.length === 0 || elem.equals(this.treedb.EMPTY))
        return null;
      return elem;
    }

    bufArrToHexArr (arr) {
      if (arr.some(el => !Buffer.isBuffer(el))) {
        throw new Error('Array is not an array of buffers');
      }
  
      return arr.map(el => '0x' + el.toString('hex'));
    }
  
    sortAndConcat (...args) {
      return Buffer.concat([...args].sort(Buffer.compare));
    }

    getDatasetItemPair(i) {
      const buf1 = this.ethash.calcDatasetItem(2*i,[]);
      const buf2 = this.ethash.calcDatasetItem(2*i+1,[]);
      return Buffer.concat([buf1, buf2]);
    }
}

//const MerkleProof = artifacts.require("MerkleProof");

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
  return a;
}

function getProof(merkel, header, indexes) {
  const epoch = EthashUtil.getEpoc(header.number);
  const cacheSize = EthashUtil.getCacheSize(epoch);
  const fullSize = EthashUtil.getFullSize(epoch);
  const seed = EthashUtil.getSeed(Buffer.alloc(32), 0, epoch);
  /*
  const N = 129;//16*1024*1024/128;
  const cacheSize = 128*N;//16*1024*1024;
  const fullSize = cacheSize;
  const seed = Buffer.alloc(32);*/
  //const ethash = new Ethash.default();
  //const cache = ethash.mkcache(cacheSize, seed);
  D("epoch:", epoch);
  D("seed:", seed.toString('hex'));
  D("cacheSize:", cacheSize, "totalSize:", fullSize);
  //D(cache[0].length, cache.slice(-1)[0].length);
    //const merkel = new MerkleTree(`tredb-${fullSize}.db`,seed, cacheSize, fullSize);
    D("root:");
    const root = merkel.getHexRoot();
    D(root);


    //const result = verifyHeader(ethash, header, fullSize);
    const result = {indexes};
    D("----------------proof:", result.indexes.length);
    const proofs = [];
    result.indexes.forEach(index => {
      const proof = merkel.getProof(index);
      proofs.push(proof);
    });
    D(proofs.length);
    return {root, proofs};
    //return;
    //const c = await MerkleProof.new();
    //const r = await c.batchVerify.sendTransaction(proofs, root, leafs, {gas:80000000});
    //D(r);
}

module.exports = {
  MerkleTree,
  getProof
}
