const { ethers } = require("hardhat");

// npx hardhat run --network kovan scripts/deploy_erc20.js
async function main() {
    const FaucetToken = await ethers.getContractFactory("FaucetToken");
    const erc20 = await upgrades.deployProxy(
        FaucetToken,
        ["My ERC20 Token", "MyERC20", 18],
        {
            initializer: "initialize"
        }
    );
    console.log("ERC20 deployed to:", erc20.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });