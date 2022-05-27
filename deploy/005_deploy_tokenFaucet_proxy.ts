/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const FaucetToken = await ethers.getContractFactory("FaucetToken");
  const faucetToken = await upgrades.deployProxy(FaucetToken, [
    "HorizonFaucetToken",
    "HFT",
  ]);
  console.log("FaucetToken deployed to:", faucetToken.address);
};

deployFunction.dependencies = [];
deployFunction.tags = [
  "FaucetToken",
  "Ethereum",
  "Harmony",
  "Test",
  "Deploy",
  "Working",
];
export default deployFunction;
