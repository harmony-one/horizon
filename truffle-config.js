require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const privateKey = process.env.PRIVATE_KEY;

const localnet = process.env.LOCALNET;
const testnet = process.env.TESTNET;
const mainnet = process.env.MAINNET;

module.exports = {
  networks: {
    localnet: {
      provider: () => new HDWalletProvider(privateKey, localnet),
      network_id: 1666700000,
      skipDryRun: true,
    },
    testnet: {
      provider: () => new HDWalletProvider(privateKey, testnet),
      network_id: 1666700000,
      skipDryRun: true,
    },
    mainnet: {
      provider: () => new HDWalletProvider(privateKey, mainnet),
      network_id: 1666600000,
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.7.3",//"0.6.12",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
