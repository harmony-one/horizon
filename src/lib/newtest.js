const transactions = require('../test/transaction.json');
const { ethers } = require("hardhat");
const util = require("util");
require("dotenv").config();
const Web3 = require("web3");
const { toRLPHeader, rpcWrapper, getReceiptProof } = require("./utils");

let mmrVerifier, MMRVerifier;
let prover, HarmonyProver;
let lightclient, HarmonyLightClient;
let tokenLockerOnEthereum, TokenLockerOnEthereum;

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

async function getMmrProof(txnHash, refBlockNum) {
    let web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
    const sendRpc = util.promisify(web3.currentProvider.send)
        .bind(web3.currentProvider);
    return await sendRpc({
        jsonrpc: "2.0",
        method: "hmyv2_getTxMmrProof",
        params: [txnHash, web3.utils.toDecimal(refBlockNum)],
        id: (new Date()).getTime(),
    });
}
getMmrProof(transactions.hash, "0xf").then((res) => { console.log(res); });

async function fetchBlock(blockNumber) {
    let web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
    const sendRpc = util.promisify(web3.currentProvider.send)
        .bind(web3.currentProvider);
    return await sendRpc({
        jsonrpc: "2.0",
        method: "hmyv2_getFullHeader",
        params: [blockNumber],
        id: (new Date()).getTime(),
    });
}
// fetchBlock("0xe").then((res)=>{console.log(res);});

async function deploy() {
    MMRVerifier = await ethers.getContractFactory("MMRVerifier");
    mmrVerifier = await MMRVerifier.deploy();
    await mmrVerifier.deployed();
    console.log("MMRVerifier deployed to:", mmrVerifier.address);

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
    console.log("HarmonyProver deployed to:", prover.address);

    let initialBlock = "0xe";
    let response = await fetchBlock(initialBlock);
    console.log(response);
    let initialBlockRlp = toRLPHeader(response.result);

    let relayers = ["0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016"];
    let threshold = 1;

    HarmonyLightClient = await ethers.getContractFactory("HarmonyLightClient");

    lightclient = await upgrades.deployProxy(
        HarmonyLightClient,
        [initialBlockRlp, relayers, threshold],
        {
            initializer: "initialize"
        }
    );
    // lightclient = await HarmonyLightClient.deploy(initialBlockRlp, relayers, threshold);
    console.log("HarmonyLightClient deployed to:", lightclient.address);

    let epoch = response.result.epoch;
    let mmrRoot = response.result.mmrRoot;
    console.log(epoch, mmrRoot);
    console.log(await lightclient.isValidCheckPoint(epoch, mmrRoot));

    // deploy token locker
    TokenLockerOnEthereum = await ethers.getContractFactory(
        "TokenLockerOnEthereum",
        {
            libraries: {
                HarmonyProver: prover.address
            }
        }
    );
    tokenLockerOnEthereum = await upgrades.deployProxy(
        TokenLockerOnEthereum,
        [],
        {
            initializer: "initialize",
            unsafeAllowLinkedLibraries: true
        }
    );
    console.log("TokenLockerOnEthereum deployed to:", tokenLockerOnEthereum.address);

    // set otherside locker to self for testing purpose
    await tokenLockerOnEthereum.bind(tokenLockerOnEthereum.address);

    // set lightclient to token locker
    await tokenLockerOnEthereum.changeLightClient(lightclient.address);

    let mmrProof = await getMmrProof(transactions.hash, "0xd");

    console.log(mmrProof);

    let receiptProof = await txReceiptProof();

    // console.log(receiptProof);

    // await tokenLockerOnEthereum.receiveHeader(receiptProof.header);
    // console.log("receiveHeader");

    mmrProof.result.root = "0x" + mmrProof.result.root;
    mmrProof.result.peaks = mmrProof.result.peaks.map(function (item) {
        return "0x" + item;
    });
    mmrProof.result.siblings = mmrProof.result.siblings.map(function (item) {
        return "0x" + item;
    });
    // console.log(mmrProof.result);
    // await tokenLockerOnEthereum.receiveProof(mmrProof.result);
    // console.log("receiveProof");

    // await tokenLockerOnEthereum.receiveReceipt(receiptProof);
    // console.log("receiveReceipt");
    // console.log(tokenLockerOnEthereum);
    try {
        await tokenLockerOnEthereum.validateAndExecuteProof(receiptProof.header, mmrProof.result, receiptProof, {gasLimit: process.env.GAS_LIMIT});
        console.log("done!");
    } catch (error) {
        console.log(error);
    }
}

async function getRevertReason(txHash) {
    const tx = await web3.eth.getTransaction(txHash);

    var result = await web3.eth.call(tx, tx.blockNumber);

    result = result.startsWith("0x") ? result : `0x${result}`;

    if (result && result.substr(138)) {
        console.log(result);
        console.log(`0x${result.substr(138)}`);
        const reason = web3.utils.toAscii(`0x${result.substr(138)}`);
        console.log("Revert reason:", reason);
        return reason;
    } else {
        console.log("Cannot get reason - No return value");
    }
}


async function txReceiptProof() {
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
    return txProof;
}
// receiptProof().then((proof) => { console.log(proof); });

async function main() {
    await deploy();

    // let callback = getReceiptProof;
    // let callbackArgs = [
    //     process.env.LOCALNET,
    //     prover,
    //     transactions.hash
    // ];
    // let isTxn = true;
    // let txProof = await rpcWrapper(
    //     transactions.hash,
    //     isTxn,
    //     callback,
    //     callbackArgs
    // );
    // // console.log(txProof);


    // let response = await prover.getBlockRlpData(options);
    // console.log(response);
}

// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });