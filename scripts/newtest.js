const transactions = require('../test/transaction.json');
const { rpcWrapper, getReceiptProof } = require('../scripts/utils');
const { ethers } = require("hardhat");
const util = require("util");
require("dotenv").config();
const Web3 = require("web3");
const { toRLPHeader } = require("./utils");

let mmrVerifier, MMRVerifier;
let prover, HarmonyProver;
let lightclient, HarmonyLightClient;

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

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

async function deploy() {
    // MMRVerifier = await ethers.getContractFactory("MMRVerifier");
    // mmrVerifier = await MMRVerifier.deploy();
    // await mmrVerifier.deployed();

    // HarmonyProver = await ethers.getContractFactory(
    //     "HarmonyProver",
    //     {
    //         libraries: {
    //             MMRVerifier: mmrVerifier.address
    //         }
    //     }
    // );
    // prover = await HarmonyProver.deploy();
    // await prover.deployed();

    let initialBlock = "0xc2";
    let response = await fetchBlock(initialBlock);
    let initialBlockRlp = toRLPHeader(response.result);

    let relayers = ["0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016"];
    let threshold = 1;

    const HarmonyLightClient = await ethers.getContractFactory("HarmonyLightClient");

    lightclient = await upgrades.deployProxy(HarmonyLightClient, [initialBlockRlp, relayers, threshold], { initializer: "initialize" });
    // lightclient = await HarmonyLightClient.deploy(initialBlockRlp, relayers, threshold);
    console.log("HarmonyLightClient deployed to:", lightclient.address);
}


async function main() {
    let response = await deploy();

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

main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });