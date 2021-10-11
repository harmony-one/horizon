async function main() {
    // Deploying
    const Box = await ethers.getContractFactory("Box");
    const instance = await upgrades.deployProxy(Box, [42]);
    await instance.deployed();

    // Upgrading
    const BoxV2 = await ethers.getContractFactory("BoxV2");
    const upgraded = await upgrades.upgradeProxy(instance.address, BoxV2);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });