/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const TokenLockerOnHarmony = await ethers.getContractFactory(
    "TokenLockerOnHarmony"
  );
  const tokenLockerOnHarmony = await upgrades.deployProxy(
    TokenLockerOnHarmony,
    []
  );
  console.log(
    "TokenLockerOnHarmony deployed to:",
    tokenLockerOnHarmony.address
  );
};

deployFunction.dependencies = [];
deployFunction.tags = ["TokenLockerOnHarmony", "Harmony", "Deploy", "Working"];
export default deployFunction;
