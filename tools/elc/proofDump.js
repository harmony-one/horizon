const yargs = require('yargs');
const { DagProof } = require("../eth2hmy-relay/lib/DagProof");
const EthashUtil = require('@ethereumjs/ethash/dist/util');
const { getBlockByNumber } = require("../eth2hmy-relay/lib/getBlockHeader.js");
const fs = require('fs');

const argv = yargs
.option('epoch', {
    alias: 'e',
    description: 'List all functins',
    type: 'number'
})
.option('block', {
    alias: 'b',
    description: 'Block needs to be proved',
    type: 'string',

})
.option('root', {
    alias: 'r',
    description: 'get root of merkel tree'
})
.option('proof', {
    alias: 'p',
    description: 'get block proof'
})
.option('dag', {
    alias: 'g',
    description: 'generate dag merkel proof tree',
})
.option('ethurl', {
    alias: 'u',
    description: 'Ethereum RPC URL',
    type: 'string',
}).env()
.help()
.alias('help', 'h').argv;

async function main(){
    if(argv.dag) {
        const epoch = argv.epoch;
        if(!epoch) { 
            console.log("please provide epoch");
            return;
        }
        return new DagProof(epoch);
    }

    if(argv.root) {
        const epoch = argv.epoch;
        if(!epoch) { 
            console.log("please provide epoch");
            return;
        }
        if(!DagProof.existsEpoch(epoch)) {
            console.log("please generate DAG first");
            return;
        }
        const dagProof = new DagProof(epoch);
        console.log(dagProof.merkel.getHexRoot());
        return;
    }

    if(argv.proof) {
        const blockNo = argv.block;
        if(!blockNo){
            console.log("please provide block number");
            return;
        }
        const epoch = EthashUtil.getEpoc(blockNo);
        if(!DagProof.existsEpoch(epoch)) {
            console.log("please generate DAG first");
            return;
        }
        const EthUrl = argv.ethurl;
        const dagProof = new DagProof(epoch);
        
        const header = await getBlockByNumber(EthUrl, blockNo);
        const proofs = dagProof.getProof(header);
        const rlpHeader = header.serialize();
        const _toHex = e=>`0x${e.toString('hex')}`;
        const proofJson = {
            header_rlp: _toHex(rlpHeader),
            merkle_root: _toHex(proofs.root),
            elements: proofs.dagData.map(elems=>elems.map(_toHex)),
            merkle_proofs: proofs.proofs.map(_toHex),
        }
        const dumpFile = `block_${blockNo}.json`;
        fs.writeFileSync(dumpFile, JSON.stringify(proofJson));
        console.log("write to", dumpFile)
        return;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });