/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
// TODO fix this import DeployFunction definition exists in hardhat-deploy/types.ts
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "ethers/lib/utils";

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("FaucetToken", {
    from: deployer,
    args: ["HorizonFaucetToken", "HFT"],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
    autoMine: true, // speed up deployment on local network (ganache, hardhat), no effect on live networks
  });
};
deployFunction.dependencies = [];
deployFunction.tags = ["FaucetToken", "Ethereum", "Harmony", "Test", "NoProxy"];
export default deployFunction;
