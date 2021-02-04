const mmap = require("mmap-io")
const fs = require("fs");
const D = console.log;

class MmapDB {
    PROT = mmap.PROT_WRITE | mmap.PROT_READ
    FLAG = mmap.MAP_SHARED
    BUFMAX=1024*1024*1024 // shoud be 2*1024*1024*1024-1
    METASIZE = 4096;
    constructor(dir) {
        this.dir = dir;
        const name = `${dir}/meta`;
        const flag = fs.existsSync(name) ? "r+" : "w+";
        this.fd = fs.openSync(name, flag);
        const info = fs.fstatSync(this.fd);
        if(info.size < this.METASIZE)
            fs.ftruncateSync(this.fd, this.METASIZE);
        this.meta = this._mmap(this.fd, 0, this.METASIZE);
    }

    _mmap(fd, offset, size) {
        return mmap.map(size, this.PROT, this.FLAG, fd, offset);
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
            const buf = this._mmap(this.fd, offset, this.BUFMAX);
            offset += this.BUFMAX;
            remains -= this.BUFMAX;
            this.bufs.push(buf);
        }
        const bugOff = 2*mmap.PAGESIZE;
        const buf = this._mmap(this.fd, offset-bugOff, remains + bugOff);
        this.bufs.push(buf.slice(bugOff));
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
        this.layers = layersInfo.map((layerNums,depth) => {
            const size = layerNums*this.HASH_SIZE;
            const layer = this.getMmapBuffer(`${this.dir}/layer_${depth}`, size);
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
        /*
        for(let i = 0; i < layer.length; i++) {
            const buf = layer[i];
            if(start < buf.length) return buf.slice(start, start+this.HASH_SIZE);
            start -= buf.length;
        }
        throw `exceed range ${layer.depth} ${layer.elemsNums} ${layer[0].length} ${layer.reduce((a,b)=>a+b.length, 0)} ${index}`;
        */
    }
}

module.exports = {
    MerkelDB
}