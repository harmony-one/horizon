import { expect } from 'chai'
import { ethers, network } from 'hardhat'
const rlp = require('rlp')
const headerData = require('./data/headers.json')
const transactions = require('./data/transaction.json')
const {
    rpcWrapper,
    getReceiptProof
} = require('../src/lib/utils')

let MMRVerifier, HarmonyProver
let prover, mmrVerifier

function hexToBytes (hex) {
    let bytes
    for (let c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16))
    }
    return bytes
}

describe('HarmonyProver', function () {
    beforeEach(async function () {
        MMRVerifier = await ethers.getContractFactory('MMRVerifier')
        mmrVerifier = await MMRVerifier.deploy()
        await mmrVerifier.deployed()

        // await HarmonyProver.link('MMRVerifier', mmrVerifier);
        HarmonyProver = await ethers.getContractFactory('HarmonyProver', {
            libraries: {
                MMRVerifier: mmrVerifier.address
            }
        })
        prover = await HarmonyProver.deploy()
        await prover.deployed()
    })

    it('parse rlp block header', async function () {
        const header = await prover.toBlockHeader(hexToBytes(headerData.rlpheader))
        expect(header.hash).to.equal(headerData.hash)
    })

    it('parse transaction receipt proof', async function () {
        const callback = getReceiptProof
        const callbackArgs = [process.env.LOCALNET_URL, prover, transactions.hash]
        const isTxn = true
        const txProof = await rpcWrapper(
            transactions.hash,
            isTxn,
            callback,
            callbackArgs
        )
        console.log(txProof)
        expect(txProof.header.hash).to.equal(transactions.header)

        // let response = await prover.getBlockRlpData(txProof.header);
        // console.log(response);

    // let res = await test.bar([123, "abc", "0xD6dDd996B2d5B7DB22306654FD548bA2A58693AC"]);
    // // console.log(res);
    })
})

let TokenLockerOnEthereum, tokenLocker
let HarmonyLightClient, lightclient

describe('TokenLocker', function () {
    beforeEach(async function () {
        TokenLockerOnEthereum = await ethers.getContractFactory(
            'TokenLockerOnEthereum'
        )
        tokenLocker = await MMRVerifier.deploy()
        await tokenLocker.deployed()

        await tokenLocker.bind(tokenLocker.address)

    // // await HarmonyProver.link('MMRVerifier', mmrVerifier);
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
    })

    it('issue map token test', async function () { })

    it('lock test', async function () { })

    it('unlock test', async function () { })

    it('light client upgrade test', async function () { })
})
