const { DagProof } = require("../lib/DagProof.js");
const { getBlockByNumber } = require("../lib/getBlockHeader.js");

async function main(){
    const epoch = 387;
    const number = epoch*30000+1;
    const dagProof = new DagProof(epoch);
    const header = await getBlockByNumber(number);
    const proofs = dagProof.getProof(header);
    proofs.dagData = proofs.dagData.map(dags=>dags.map(dag=>`0x${dag.toString('hex')}`));
    proofs.proofs = proofs.proofs.map(proofs=>proofs.map(proof=>`0x${proof.toString('hex')}`));
    console.log(proofs);
}

main();