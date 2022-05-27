/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const faucetTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const FaucetToken = await ethers.getContractFactory("FaucetToken");
  const faucetToken = await upgrades.upgradeProxy(
    faucetTokenAddress,
    FaucetToken
  );
  console.log("faucetToken upgraded");
//   await faucetToken.deployed();
  console.log("FaucetToken deployed to:", faucetToken.address);
};

deployFunction.dependencies = [];
deployFunction.tags = ["FaucetToken", "Ethereum", "Harmony", "Test", "Upgrade"];
export default deployFunction;
