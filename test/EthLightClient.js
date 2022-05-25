const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const block1 = require('./proof1.json');
const block2 = require('./proof2.json');

function hexToBytes(hex) {
    for (let bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

const DEBUG = true;

function debug(msg){
    if(DEBUG) console.log(msg);
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
        it("Partial Fork and Total Difficulty Test", async function () {
            prevHashes = ['68776803263250831790672116253057717414537012912849465124179566887710318158907' , '2', '3', '4234' , '555', '1', '2568', '9870', '990'];
            hashes = ['2', '3', '4234' , '555', '1', '2568', '9870', '990', '437'];
            difficulties = ['400', '400', '400', '400', '400', '400', '400', '400', '400'];
            expectedTotalDifficulties = ['400', '800', '1200', '1600', '2000', '2400', '2800', '3200', '3600'];
            baseDifficulty = 5551247598;

            forkHashes = ['159', '435', '3456']
            forkPrevHashes = ['1' ,'159', '435']
            forkDifficulties = ['400', '1200', '1600'];
            expectedForkTotalDifficulties = ['400', '1600', '3200'];
            forkBaseDifficulty = 5551249598;

            forkIndex = 5;

            for (let i = 0; i < hashes.length; i++) {
                await ELC.dummmyAddBlockHeader(prevHashes[i], difficulties[i], hashes[i]);
                //debug((await ELC.canonicalHead()).toString())
                totalDiff = (await ELC.blocks(hashes[i])).totalDifficulty.toString();
                //debug(`Total Diff ${totalDiff}`);
                expect(parseInt(totalDiff) - baseDifficulty).to.equal(parseInt(expectedTotalDifficulties[i]));
            }

            for (let i = 0; i < forkHashes.length; i++) {
                await ELC.dummmyAddBlockHeader(forkPrevHashes[i], forkDifficulties[i], forkHashes[i]);
                //debug((await ELC.canonicalHead()).toString())
                totalDiff = (await ELC.blocks(forkHashes[i])).totalDifficulty.toString();
                //debug(`Total Diff ${totalDiff}`);
                expect(parseInt(totalDiff) - forkBaseDifficulty).to.equal(parseInt(expectedForkTotalDifficulties[i]));
            }

            for (let i = 0; i < hashes.length; i++) {
                isCanon = await ELC.canonicalBlocks(hashes[i]);
                //debug(`Block ${hashes[i]} is canon? ${isCanon}`);
                if(i < forkIndex) expect(isCanon).to.equal(true);
                else expect(isCanon).to.equal(false);
            }

            for (let i = 0; i < forkHashes.length; i++) {
                isCanon = await ELC.canonicalBlocks(forkHashes[i]);
                //debug(`Block ${forkHashes[i]} is canon? ${isCanon}`);
                expect(isCanon).to.equal(true);
            }
        })
        it("Complete fork replacement", async function () {
            prevHashes = ['68776803263250831790672116253057717414537012912849465124179566887710318158907' , '2', '3', '4234' , '555', '1', '2568', '9870', '990'];
            hashes = ['2', '3', '4234' , '555', '1', '2568', '9870', '990', '437'];
            difficulties = ['400', '400', '400', '400', '400', '400', '400', '400', '400'];

            forkHashes = ['159', '435', '3456', '1114541', '5654681861', '16579165161', '156546813211', '159489515312', '259845', '25412541', '2548', '15547', '25814', '36525']
            forkPrevHashes = ['125' , '159', '435', '3456', '1114541', '5654681861', '16579165161', '156546813211', '159489515312', '259845', '25412541', '2548', '15547', '25814']
            forkDifficulties = ['5551247598', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400', '400'];

            console.log(forkHashes.length)

            for (let i = 0; i < hashes.length; i++) {
                await ELC.dummmyAddBlockHeader(prevHashes[i], difficulties[i], hashes[i]);
                //debug((await ELC.canonicalHead()).toString())
            }

            for (let i = 0; i < forkHashes.length; i++) {
                await ELC.dummmyAddBlockHeader(forkPrevHashes[i], forkDifficulties[i], forkHashes[i]);
                //debug((await ELC.canonicalHead()).toString())
            }

            for (let i = 0; i < hashes.length; i++) {
                isCanon = await ELC.canonicalBlocks(hashes[i]);
                debug(`Block ${hashes[i]} is canon? ${isCanon}`);
                expect(isCanon).to.equal(false);
            }

            for (let i = 0; i < forkHashes.length; i++) {
                isCanon = await ELC.canonicalBlocks(forkHashes[i]);
                debug(`Block ${forkHashes[i]} is canon? ${isCanon}`);
                expect(isCanon).to.equal(true);
            }

            isCanon = await ELC.canonicalBlocks(prevHashes[0]);
            debug(`Original initializing block is canon? ${isCanon}`);
        })
    })
});