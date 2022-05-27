/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";
import { getBlockByNumber } from "../src/eth2hmy-relay/lib/getBlockHeader";

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const url = process.env.ETH_NODE_URL;
  const blockNum = 27625582;
  const initHeader = await getBlockByNumber(url, blockNum);
  const EthereumLightClient = await ethers.getContractFactory(
    "EthereumLightClient"
  );
  const ethereumLightClient = await upgrades.deployProxy(EthereumLightClient, [
    initHeader.serialize()
  ]);
  console.log("EthereumLightClient deployed to:", ethereumLightClient.address);
};

deployFunction.dependencies = [];
deployFunction.tags = ["EthereumLightClient", "Harmony"];
export default deployFunction;
