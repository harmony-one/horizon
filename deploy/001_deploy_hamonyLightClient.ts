/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import { promisify } from "util";
import { toRLPHeader } from "../src/lib/utils";

async function fetchBlock(blockNumber) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.LOCALNET);
  const sendRpc = promisify(provider.send).bind(provider);
  return await sendRpc({
    jsonrpc: "2.0",
    method: "hmyv2_getFullHeader",
    params: [blockNumber],
    id: new Date().getTime(),
  });
}

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
//   const firstRlpHeader = ""; // bytes memory firstRlpHeader,
//   const initialRelayers = ""; // address[] memory initialRelayers,
//   const initialRelayersThreshold = ""; // uint8 initialRelayerThreshold
  const initialBlock = "0xe";
  const response = await fetchBlock(initialBlock);
  const initialBlockRlp = toRLPHeader(response.result);
  const relayers = ["0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016"];
  const threshold = 1;
  const HarmonyLightClient = await ethers.getContractFactory(
    "HarmonyLightClient"
  );
  const harmonyLightClient = await upgrades.deployProxy(HarmonyLightClient, [
    initialBlockRlp,
    relayers,
    threshold,
  ]);
  console.log("HarmonyLightClient deployed to:", harmonyLightClient.address);
};

deployFunction.dependencies = [];
deployFunction.tags = ["HarmonyLightClient", "Ethereum"];
export default deployFunction;
