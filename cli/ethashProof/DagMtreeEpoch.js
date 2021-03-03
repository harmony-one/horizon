const { DagProof } = require('../../eth2hmy-relay');


function generateDagMTree(dagPath, epoch) {
    const dagProof = new DagProof(dagPath);
    dagProof.loadDAG(epoch);
    return dagProof;
}

function genearateDagMTreeRange(dagPath, start, num) {
    start = Number(start);
    num = Number(num);
    const dagProofs = [];
    for(let i = 0; i < num; i++) {
        const epoch = start + i;
        console.log("generate epoch:", epoch);
        const proof = generateDagMTree(dagPath, start + i);
        dagProofs.push(proof);
    }
    return dagProofs;
}

module.exports = {generateDagMTree,genearateDagMTreeRange}