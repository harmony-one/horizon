const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const block1 = require('./proof1.json');
const block2 = require('./proof2.json');

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}


describe("Ethereum Light Client", function () {

    let ELC, ELCDeployer;

    beforeEach(async function () {
        const [owner] = await ethers.getSigners();

        ELCDeployer = await ethers.getContractFactory("TesterEthereumLightClient");

        rlpHeader = block1.header_rlp.substring(2);

        bytes = hexToBytes(rlpHeader);

        ELC = await upgrades.deployProxy(ELCDeployer, [bytes]);

        await ELC.deployed();
    });

    it("Dummy Add Block TELC", async function () {

        hashes = ['68776803263250831790672116253057717414537012912849465124179566887710318158907', '25', '12', '9999999', '1543254325', '2154326543656436543653']

        console.log(ELC.address);

        console.log((await ELC.canonicalHead()).toString())

        await ELC.dummmyAddBlockHeader(hashes[0], 400 ,hashes[1]);

        CHead = (await ELC.canonicalHead()).toString();

        parentHash = (await ELC.blocks(hashes[1])).parentHash.toString();

        expect(parentHash).to.equal(hashes[0]);

        expect(CHead).to.equal(hashes[1]);



        await ELC.dummmyAddBlockHeader(hashes[1], 250, hashes[2]);

        CHead = (await ELC.canonicalHead()).toString();

        parentHash = (await ELC.blocks(hashes[2])).parentHash.toString();

        expect(parentHash).to.equal(hashes[1]);

        expect(CHead).to.equal(hashes[2]);
    });

    describe("Forking tests", function() {
        it("Partial Fork", async function () {
            prevHashes = ['68776803263250831790672116253057717414537012912849465124179566887710318158907' , '2', '3', '4234' , '555', '1', '2568'];
            hashes = ['2', '3', '4234' , '555', '1', '2568', '9870', '990', '437'];
            difficulties = ['400', '400', '400', '400', '400', '400', '400', '400', '400'];

            forkHashes = ['2', '3', '4234' , '555', '1', '159', '435', '3456']
            forkdifficulties = ['400', '400', '400', '400', '400', '400', '1200', '1600'];




        })
        it("Complete fork replacement", async function () {

        } )
    })
});