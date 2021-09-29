const transactions = require('../test/transaction.json');
const { rpcWrapper, getReceiptProof } = require('../scripts/utils');
const { ethers } = require("hardhat");

let MMRVerifier, HarmonyProver;
let prover, mmrVerifier;

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}


(async function () {
    MMRVerifier = await ethers.getContractFactory("MMRVerifier");
    mmrVerifier = await MMRVerifier.deploy();
    await mmrVerifier.deployed();

    // await HarmonyProver.link('MMRVerifier', mmrVerifier);
    HarmonyProver = await ethers.getContractFactory(
        "HarmonyProver",
        {
            libraries: {
                MMRVerifier: mmrVerifier.address
            }
        }
    );
    prover = await HarmonyProver.deploy();
    await prover.deployed();

    let callback = getReceiptProof;
    let callbackArgs = [
        process.env.LOCALNET,
        prover,
        transactions.hash
    ];
    let isTxn = true;
    let txProof = await rpcWrapper(
        transactions.hash,
        isTxn,
        callback,
        callbackArgs
    );
    // console.log(txProof);


    let response = await prover.getBlockRlpData(options);
    console.log(response);
})();