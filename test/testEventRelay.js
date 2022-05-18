const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const block1 = require('./proof1.json');
const { EProver } = require('../tools/eprover');
const {getBlockByNumber} = require("../cli/ethashProof/BlockProof");
const {DagProof} = require('../tools/eth2hmy-relay/lib/DagProof');
require("hardhat-gas-reporter");

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

const _toHex = e => `0x${e.toString('hex')}`;

async function addBlocksInRange(ELC, rpc, startBlock, numBlocks, dagPath){
    for (var currentBlock = startBlock; currentBlock < startBlock + numBlocks; currentBlock++){
        header = await getBlockByNumber(rpc, currentBlock);

        dagProver = new DagProof(dagPath);

        let proofs = dagProver.getProof(header);

        await ELC.addBlockHeader(header.serialize(), proofs.dagData, proofs.proofs, {gasLimit: 3000000 });

        console.log(`added block ${currentBlock} to ELC`);
    }
}

function transformNestedByteArray(arr){
    for (var i = 0; i < arr.length; i++){
        for (var k = 0; k < arr[i].length; k++){
            arr[i][k] = _toHex(arr[i][k]);
        }
    }
}

const DEBUG = true;

function debug(msg){
    if(DEBUG) console.log(msg);
}

const rpcUrl = process.env.RPCURL;
const eventTx = "0x95f6998ff7c767a0b0d2f2cef4e6975cd5b9d3177dbee35f7b15e54e782ec688";


describe("Token Locker Cross Chain Event Passing", function () {

    let ELC, ELCDeployer, LockerOnHarmony, LockerOnHarmonyDeployer, header;

    beforeEach(async function () {
        const [owner] = await ethers.getSigners();

        ELCDeployer = await ethers.getContractFactory("EthereumLightClient");

        header = await getBlockByNumber(rpcUrl, 12274369);

        ELC = await upgrades.deployProxy(ELCDeployer, [header.serialize()]);

        await ELC.deployed();

        LockerOnHarmonyDeployer = await ethers.getContractFactory("TokenLockerOnHarmony");

        LockerOnHarmony = await upgrades.deployProxy(LockerOnHarmonyDeployer, []);

        await LockerOnHarmony.deployed();

        const prover = new EProver(rpcUrl);

        const proof = await prover.receiptProof(eventTx);

        await addBlocksInRange(ELC, rpcUrl, 12274370, 20, './cli/.dag');

    });

    it("Add surrounding blocks to ELC", async function () {

    });

    describe("Test Event Relaying/Proving", function() {
        it("Execute add token event from stored transaction", async function () {
        })
    })
});
