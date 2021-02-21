const { MerkelDB } = require('./MmapDB.js');
const { Keccak } = require('sha3');

const D = console.log;

function sha3(str) {
    const hash = new Keccak(256);
    hash.update(str);
    return hash.digest();
}

class MetaInfo {
  VERSION="0.0.1"
  constructor(meta){
    this.meta = meta;
  }
  getDagInfo() {
    const meta = this.meta;
    if(meta && meta.version == this.VERSION){
      return {
        seed: Buffer.from(meta.dag.seed, 'hex'),
        cacheSize: meta.dag.cacheSize,
        fullSize: meta.dag.fullSize,
      }
    }
  }

  setDagInfo(dag) {
    return {
      dag:{
        ...dag,
        seed: dag.seed.toString('hex')
      },
      version:this.VERSION
    }
  }

}

class MerkleTree {
    ELEM_SIZE=128;
    constructor(dirname, seed, cacheSize, fullSize, ethash){
      const dag = {seed, cacheSize, fullSize}

      this.treedb = new MerkelDB(dirname);
      const meta = new MetaInfo(this.treedb.META());
      const dagInfo = meta.getDagInfo();
      if(dagInfo) {
        dag.seed = dagInfo.seed;
        dag.cacheSize = dagInfo.cacheSize;
        dag.fullSize = dagInfo.fullSize;
      }

      const layersNum = [dag.fullSize/this.ELEM_SIZE];
      while(layersNum[0] > 1) {
        const size = layersNum[0];
        layersNum.unshift(Math.ceil(size/2))
      }
      this.treedb.init(layersNum);
      if(!dagInfo) {
        D("init database")
        const depth = layersNum.length;
        D("merkel depth:", depth);
        const leafLayer = this.treedb.getLayer(depth-1);
        let startTime = Date.now();
        const LoopN = dag.fullSize/this.ELEM_SIZE;
        //console.warn("skip some data, just for debug")
        for(let i = 0; i < LoopN; i++){
          if(i % 128 == 0 && Date.now() - startTime > 10000){ D(`leafLayer: ${i}/${LoopN}`); startTime = Date.now();}
          const buf1 = ethash.calcDatasetItem(2*i, []);
          const buf2 = ethash.calcDatasetItem(2*i+1, []);
          const bufIndex = Buffer.alloc(32);
          bufIndex.writeUInt32BE(2*i, 28);
          const elem = sha3(Buffer.concat([bufIndex, buf1, buf2]));
          const elemSlice = this.treedb.getElem(leafLayer, i);
          elem.copy(elemSlice);
        }
        this.getLayers(leafLayer, depth-1);
        this.treedb.saveMeta(meta.setDagInfo(dag));
      }
      this.ethash = ethash;
      this.layersReverse = [...this.treedb.getLayers()].reverse(); // leafLayer...rootLayer
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
  
    getNextLayer (lowerLayer, layer) {
      let startTime = Date.now();
      for(let i = 0; i < layer.elemsNums; i++){
        if(i % 128 == 0 && Date.now() - startTime > 10000){ D("NextLayer", i, layer.elemsNums); startTime = Date.now();}
        const index = 2*i;
        const elem1 = this.treedb.getElem(lowerLayer, index);
        const elem2 = index+1 < lowerLayer.elemsNums ? this.treedb.getElem(lowerLayer, index+1) : undefined;
        const elemHash = this.combinedHash(elem1, elem2);
        const targetSlice = this.treedb.getElem(layer, i);
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
      //return this.layersReverse[this.layersReverse.length - 1][0];
      const layer = this.layersReverse[this.layersReverse.length - 1];
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
      return this.layersReverse.reduce((proof, layer) => {
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

module.exports = {
  MerkleTree
}
