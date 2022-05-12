const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const headerData = require('./headers.json');

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

describe("Ethereum Light Client", function () {
    it("Deploy ELC", async function () {
        const [owner] = await ethers.getSigners();

        const ELCDeployer = await ethers.getContractFactory("EthereumLightClient");

        console.log("deploying")

        bytes = hexToBytes(headerData.rlpheader);

        console.log(bytes);

        const ELC = await upgrades.deployProxy(ELCDeployer, [bytes]);

        console.log("johnny dep")

        await ELC.deployed();

        //await ELC.addBlockHeader()

        console.log(ELC.address);

        console.log(await ELC.canonicalHead())


    });
});