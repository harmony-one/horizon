require("dotenv").config();
const HDWalletProvider = require("@truffle/hdwallet-provider");
const privateKey = process.env.PRIVATE_KEY;

const localnet = process.env.LOCALNET;
const testnet = process.env.TESTNET;
const mainnet = process.env.MAINNET;

ETH_NODE_URL=process.env.ETH_NODE_URL;

module.exports = {
  networks: {
    hmy_local: {
      provider: () => new HDWalletProvider(privateKey, localnet),
      network_id: 1666700000,
      skipDryRun: true,
    },
    hmy_test: {
      provider: () => new HDWalletProvider(privateKey, testnet),
      network_id: 1666700000,
      skipDryRun: true,
    },
    hmy_main: {
      provider: () => new HDWalletProvider(privateKey, mainnet),
      network_id: 1666600000,
      skipDryRun: true,
    },
    eth_main:{
      provider: function () {
        return new HDWalletProvider(privateKey, ETH_NODE_URL);
      },
      network_id: "*",  // match any network
      gas: 4529340,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true,     // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 100000000
    },
    kovan: {
      provider: function () {
        return new HDWalletProvider(privateKey, ETH_NODE_URL);
      },
      network_id: "*",  // match any network
      gas: 4529340,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true,     // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 100000000
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
