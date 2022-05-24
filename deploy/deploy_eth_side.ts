import "hardhat-deploy"
import "@nomiclabs/hardhat-ethers"
import { ethers } from "hardhat"
import { util } from "util";
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"


async function fetchBlock(blockNumber) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.LOCALNET);
  const sendRpc = util.promisify(provider.send).bind(provider);
  return await sendRpc({
    jsonrpc: "2.0",
    method: "hmyv2_getFullHeader",
    params: [blockNumber],
    id: new Date().getTime(),
  });
}

const deployFunction: DeployFunction = async function ({
  deployments,
  getChainId,
  getNamedAccounts,
}: HardhatRuntimeEnvironment) {
  console.log("Deploying Harmony Light Client and Token Locker on Ethereum");
  const { deploy } = deployments;
  const chainId = parseInt(await getChainId());
  const { deployer } = await getNamedAccounts();

  // Deploy HarmonyLightClient

  const initialBlock = "0xe";
  const response = await fetchBlock(initialBlock);

  const initialBlockRlp = toRLPHeader(response.result);

  const relayers = ["0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016"];
  const threshold = 1;

  const HarmonyLightClient = await ethers.getContractFactory(
    "HarmonyLightClient"
  );

  const harmonyLightClient = await upgrades.deployProxy(
    HarmonyLightClient,
    [initialBlockRlp, relayers, threshold],
    {
      initializer: "initialize",
    }
  );
  console.log("HarmonyLightClient deployed to:", harmonyLightClient.address);

  const harmonyLightClient = await deploy("HarmonyLightClient", {
    from: deployer,
    args: [],
    log: true,
    deterministicDeployment: false,
    skipIfAlreadyDeployed: false,
  });

  // Deploy TokenLockerOnEthereum

  await deploy("YieldBox", {
    from: deployer,
    args: ["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", uriBuilder.address],
    log: true,
    deterministicDeployment: false,
  });
};

deployFunction.dependencies = [];
deployFunction.tags = ["EthereumSide"];

export default deployFunction;
