const Ethash = require('../ethash/dist');
const EthashUtil = require('../ethash/dist/util');
const { BN,TWO_POW256 } = require('ethereumjs-util');
const {MerkleTree} = require('./merkel.js');
const fs = require('fs');
const path = require('path');

function writeCache(name, cache){
    const fcache = cache.map(val=>val.toString('hex'));
    fs.writeFileSync(name, JSON.stringify(fcache));
}

function loadCache(name) {
    const dirname = path.dirname(name);
    if(!fs.existsSync(dirname)) fs.mkdirSync(dirname, {recursive: true});
    if(!fs.existsSync(name)) return undefined;
    const data = fs.readFileSync(name);
    const fcache = JSON.parse(data);
    return fcache.map(el=>Buffer.from(el, 'hex'));
}

class DagProof {
    merkel;ethash;epoch;fullSize;

    constructor(dagPath) {
        this.dagPath = dagPath;
        const dagDir = epoch=>`${dagPath}/${epoch}`;;
        this.cacheName = epoch=>`${dagDir(epoch)}/cache`;
        this.dagDir = dagDir;
    }

    loadDAG(epoch) {
        const ethash = new Ethash.default();
        const cacheSize = EthashUtil.getCacheSize(epoch);
        const seed = EthashUtil.getSeed(Buffer.alloc(32), 0, epoch);

        const cacheFile = this.cacheName(epoch);
        ethash.cache = loadCache(cacheFile);
        if(!ethash.cache){
            ethash.mkcache(cacheSize, seed);
            writeCache(cacheFile, ethash.cache);
        }
        const dagMerkelDir = this.dagDir(epoch);
        const fullSize = EthashUtil.getFullSize(epoch);
        this.ethash = ethash;
        this.epoch = epoch;
        this.fullSize = fullSize;
        this.merkel = new MerkleTree(dagMerkelDir, seed, cacheSize, fullSize, ethash);
    }

    verifyHeader(header) {
        const ethash = this.ethash;
        const fullSize = this.fullSize;
        const headerHash = ethash.headerHash(header.raw())
        const { difficulty, mixHash, nonce } = header
        const a = ethash.run(headerHash, nonce, fullSize)
        const result = new BN(a.hash)
        if (!(a.mix.equals(mixHash) && TWO_POW256.div(difficulty).cmp(result) === 1)) throw "ethash local wrong!";
        return a;
    }

    getProof(header) { // header: BlockHeader '@ethereumjs/block'
        const epoch = EthashUtil.getEpoc(header.number);
        if(epoch != this.epoch) this.loadDAG(epoch);

        const result = this.verifyHeader(header);
        //console.log(result.indexes);
        result.indexes = result.indexes.filter((_,i)=>i&1^1);

        const merkel = this.merkel;
        const root = merkel.getHexRoot();
        const proofs = [];
        result.indexes.forEach(index => {   // TODO: There is a lot of duplicate data that needs to be optimized
            const proof = merkel.getProof(index);
            proofs.push(proof);
        });

        const ethash = this.ethash;
        const dagData = result.indexes.map(index=>{
            const data1 = ethash.calcDatasetItem(index);
            const data2 = ethash.calcDatasetItem(index+1);
            return [
                data1.slice(0,32),data1.slice(32,64),
                data2.slice(0,32),data2.slice(32,64),
            ];
        })
        return {dagData, root, proofs};
    }

    existsEpoch(epoch) {
        return fs.existsSync(this.dagDir(epoch));
    }
}

module.exports = {DagProof}
  