const mmap = require("mmap-io")
const fs = require("fs");

class MmapDB {
    PROT = mmap.PROT_WRITE | mmap.PROT_READ
    FLAG = mmap.MAP_SHARED
    //BUFMAX=1024*1024*1024 // shoud be 2*1024*1024*1024-1

    _mmap(fd, offset, size) {
        return mmap.map(size, this.PROT, this.FLAG, fd, offset);
    }

    getMmapBuffer(name, size) {
        const pageAlign = size=>Math.ceil(size/mmap.PAGESIZE)*mmap.PAGESIZE;
        const alignSize = pageAlign(size);
        const flag = fs.existsSync(name) ? "r+" : "w+";
        const fd = fs.openSync(name, flag);
        const info = fs.fstatSync(fd);
        if(info.size < alignSize)
            fs.ftruncateSync(fd, alignSize);
        if(!this.mbufs) this.mbufs = [];
        const mbuf = this._mmap(fd, 0, alignSize);
        mbuf.slice(-1)[0]=0xa;
        this.mbufs.push(mbuf.slice(0, size));
        return mbuf;
    }
}

class MerkelDB extends MmapDB{
    HASH_SIZE=32;
    constructor(name) {
        super();
        this.dir = name;
        const metaName = this._metaName();
        if(fs.existsSync(metaName))
            this.meta = JSON.parse(fs.readFileSync(metaName));
    }

    init(layersInfo){
        this.layers = layersInfo.map((layerNums,depth) => {
            const size = layerNums*this.HASH_SIZE;
            const layerName = this._layerName(depth);
            const layer = this.getMmapBuffer(layerName, size);
            return {layer, elemsNums:layerNums, depth};
        });
    }

    getLayer(depth) {
        return this.layers[depth];
    }

    getLayers() {
        return this.layers;
    }

    getElem(layer, index){
        if(index >= layer.elemsNums) throw `exceed layers elemsNums: ${index} >= ${layer.elemsNums}`;
        let start = index*this.HASH_SIZE;
        return layer.layer.slice(start, start+this.HASH_SIZE);
    }

    _metaName() {
        return `${this.dir}/meta.json`;
    }

    META() {
        return this.meta;
    }

    saveMeta(meta) {
        this.meta = meta;
        fs.writeFileSync(this._metaName(), JSON.stringify(meta));
    }

    _layerName(depth) {
        return `${this.dir}/layer_${depth}`;
    }

    CacheName() {
        return `${this.dir}/cache`;
    }
}

module.exports = {
    MerkelDB
}