const transactions = require('../test/transaction.json');
const { ethers } = require("hardhat");
const util = require("util");
require("dotenv").config();
const Web3 = require("web3");
const { toRLPHeader, rpcWrapper, getReceiptProof } = require("./utils");

async function fetchBlock(blockNumber) {
  let web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
  const sendRpc = util.promisify(web3.currentProvider.send)
      .bind(web3.currentProvider);
  return await sendRpc({
      jsonrpc: "2.0",
      method: "hmyv2_getFullHeader",
      params: [blockNumber],
      id: (new Date()).getTime(),
  });
}

// need localhost to run
// npx hardhat run --network kovan scripts/deploy_eth_side.js
async function deployEthSideContracts() {
  // const MMRVerifier = await ethers.getContractFactory("MMRVerifier");
  // const mmrVerifier = await MMRVerifier.deploy();
  // await mmrVerifier.deployed();

  // const HarmonyProver = await ethers.getContractFactory(
  //   "HarmonyProver",
  //   // {
  //   //   libraries: {
  //   //     MMRVerifier: mmrVerifier.address
  //   //   }
  //   // }
  // );
  // const prover = await HarmonyProver.deploy();
  // await prover.deployed();

  const initialBlock = "0xe";
  const response = await fetchBlock(initialBlock);

  const initialBlockRlp = toRLPHeader(response.result);

  const relayers = ["0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016"];
  const threshold = 1;

  const HarmonyLightClient = await ethers.getContractFactory("HarmonyLightClient");

  const harmonyLightClient = await upgrades.deployProxy(
    HarmonyLightClient,
    [initialBlockRlp, relayers, threshold],
    {
      initializer: "initialize"
    }
  );
  console.log("HarmonyLightClient deployed to:", harmonyLightClient.address);

  // deploy token locker
  const TokenLockerOnEthereum = await ethers.getContractFactory(
    "TokenLockerOnEthereum",
    // {
    //   libraries: {
    //     HarmonyProver: prover.address
    //   }
    // }
  );
  const tokenLockerOnEthereum = await upgrades.deployProxy(
    TokenLockerOnEthereum,
    [],
    {
      initializer: "initialize",
      unsafeAllowLinkedLibraries: true
    }
  );
  console.log("TokenLockerOnEthereum deployed to:", tokenLockerOnEthereum.address);
  return [harmonyLightClient.address, tokenLockerOnEthereum.address]
}

// module.exports = {deployEthSideContracts};
deployEthSideContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });