const { ethers } = require("hardhat");

// npx hardhat run --network kovan scripts/deploy_erc20.js
async function main() {
    const ProverTest = await ethers.getContractFactory("EthereumProverTest");
    const prover = await upgrades.deployProxy(ProverTest, []);
    console.log("ProverTest deployed to:", prover.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });