import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@primitivefi/hardhat-dodoc";
import "hardhat-abi-exporter";
import "@atixlabs/hardhat-time-n-mine";
import "hardhat-spdx-license-identifier";
import "@openzeppelin/hardhat-upgrades";

dotenv.config();

const HARMONY_PRIVATE_KEY = process.env.PRIVATE_KEY;
const PROJECT_ID = process.env.INFURA_PROJECT_ID

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  defaultNetwork: "hardhat",
  networks: {
      localnet: {
          url: `http://localhost:9500`,
          accounts: [`0x${HARMONY_PRIVATE_KEY}`]
      },
      testnet: {
          url: `https://api.s0.b.hmny.io`,
          accounts: [`0x${HARMONY_PRIVATE_KEY}`]
      },
      mainnet: {
          url: `https://api.harmony.one`,
          accounts: [`0x${HARMONY_PRIVATE_KEY}`]
      },
      ropsten: {
          url: `https://ropsten.infura.io/v3/${PROJECT_ID}`,
          accounts: [`0x${HARMONY_PRIVATE_KEY}`]
      },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  dodoc: {
    runOnCompile: true,
    debugMode: false,
    outputDir: "docs/solidity",
  },
  abiExporter: {
    path: "./data/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
  spdxLicenseIdentifier: {
    overwrite: true,
    runOnCompile: true,
  },
};

export default config;
