const mmap = require("mmap-io")
const fs = require("fs");
const D = console.log;

class MmapDB {
    PROT = mmap.PROT_WRITE | mmap.PROT_READ
    FLAG = mmap.MAP_SHARED
    BUFMAX=1024*1024*1024
    METASIZE = 4096;
    constructor(name) {
        const flag = fs.existsSync(name) ? "r+" : "w+";
        this.fd = fs.openSync(name, flag);
        const info = fs.fstatSync(this.fd);
        if(info.size < this.METASIZE)
            fs.ftruncateSync(this.fd, this.METASIZE);
        this.meta = this._mmap(this.METASIZE, 0);
    }

    _mmap(size,offset) {
        return mmap.map(size, this.PROT, this.FLAG, this.fd, offset);
    }

    init(size) {
        const pageAlign = size=>Math.ceil(size/mmap.PAGESIZE)*mmap.PAGESIZE;
        const metaAlign = pageAlign(this.METASIZE);
        const dataAlign = pageAlign(size);
        this.size = metaAlign + dataAlign;
        const info = fs.fstatSync(this.fd);
        if(info.size < this.size)
            fs.ftruncateSync(this.fd, this.size);
        this.bufs = [];
        let remains = dataAlign;
        let offset = metaAlign;
        while(remains > this.BUFMAX){
            const buf = this._mmap(this.BUFMAX, offset);
            offset += this.BUFMAX;
            remains -= this.BUFMAX;
            this.bufs.push(buf);
        }
        const bugOff = 2*mmap.PAGESIZE;
        const buf = this._mmap(remains + bugOff, offset-bugOff);
        this.bufs.push(buf.slice(bugOff));
    }

    slice(starts, ends) {
        const slices = [];
        const si = Math.floor(starts/this.BUFMAX);
        const ei = Math.floor(ends/this.BUFMAX);
        for(let i = si; i <= ei; i++) {
            const start = i == si ? starts%this.BUFMAX : 0;
            const end = i == ei ? ends%this.BUFMAX : this.BUFMAX;
            const slice = this.bufs[i].slice(start, end);
            slices.push(slice);
        }
        return slices;
    }
    header(){return this.meta;}
}

class MerkelDB extends MmapDB{
    HASH_SIZE=32;
    EMPTY = Buffer.alloc(this.HASH_SIZE);
    constructor(name) {
        super(name);
    }

    init(layersInfo){
        const totalElems = layersInfo.reduce((a,b)=>a+b,0);
        super.init(totalElems*this.HASH_SIZE);

        let startNums = 0;
        this.layers = layersInfo.map((layerNums,depth) => {
            const start = startNums*this.HASH_SIZE;
            startNums += layerNums;
            const end = startNums*this.HASH_SIZE;
            const layer = this.slice(start, end);
            layer.elemsNums = layerNums;
            layer.depth = depth;
            return layer;
        });
    }

    getLayer(depth) {
        return this.layers[depth];
    }

    getLayers() {
        return this.layers;
    }

    getElem(layer, index){
        let start = index*this.HASH_SIZE;
        for(let i = 0; i < layer.length; i++) {
            const buf = layer[i];
            if(start < buf.length) return buf.slice(start, start+this.HASH_SIZE);
            start -= buf.length;
        }
        throw `exceed range ${layer.depth} ${layer.elemsNums} ${layer[0].length} ${layer.reduce((a,b)=>a+b.length, 0)} ${index}`;
    }
}

module.exports = {
    MerkelDB
}