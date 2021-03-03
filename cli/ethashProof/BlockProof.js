const { DagProof, getBlock } = require('../../eth2hmy-relay');
const { BlockHeader } = require('@ethereumjs/block');

let dagProof;

function getHeaderProof(dagPath, header) { // BlockHeader
    if(!dagProof || dagProof.dagPath != dagPath) {
        dagProof = new DagProof(dagPath);
    }
    return dagProof.getProof(header);
}

function parseRlpHeader(rlpHeader) {
    return BlockHeader.fromRLPSerializedHeader(rlpHeader);
}


module.exports = {getHeaderProof,parseRlpHeader,getBlock}