/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers, upgrades } from "hardhat";
import * as dotenv from "dotenv";

// TODO workaround for gas issue on ropsten https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/85
const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const FEE_DATA = {
    maxFeePerGas: ethers.utils.parseUnits("100", "gwei"),
    gasLimit: ethers.utils.parseUnits("100", "gwei"),
    maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
    gasPrice: ethers.BigNumber.from(20000000000),
  };

  // Wrap the provider so we can override fee data.
  const provider = new ethers.providers.FallbackProvider([ethers.provider], 1);
  provider.getFeeData = async () => FEE_DATA;

  // Create the signer for the mnemonic, connected to the provider with hardcoded fee data
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY).connect(provider);

  const FaucetToken = await ethers.getContractFactory("FaucetToken", signer);
  const faucetToken = await upgrades.deployProxy(FaucetToken, [
    "HorizonFaucetToken",
    "HFT",
  ]);
  // await faucetToken.deployed();
  console.log("FaucetToken deployed to:", faucetToken.address);
};

deployFunction.dependencies = [];
deployFunction.tags = [
  "FaucetToken",
  "Ethereum",
  "Harmony",
  "Test",
  "DeployWithGas",
  "DeployRopsten",
];
export default deployFunction;
