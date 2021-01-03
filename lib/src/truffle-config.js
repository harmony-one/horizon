const path = require('path')
require("dotenv").config({path: path.resolve(process.cwd(), 'envs', 'truffle.env')});
const { TruffleProvider } = require("@harmony-js/core");
const account_1_mnemonic = process.env.MNEMONIC;
const account_1_private_key = process.env.PRIVATE_KEY;
const account_2_mnemonic = process.env.MNEMONIC2;
const account_2_private_key = process.env.PRIVATE_KEY2;
const testnet_url = process.env.TESTNET_URL;
const mainnet_url = process.env.MAINNET_URL;
gasLimit = process.env.GAS_LIMIT;
gasPrice = process.env.GAS_PRICE;

module.exports = {
  networks: {
    testnet: {
      network_id: "2",
      provider: () => {
        const truffleProvider = new TruffleProvider(
            testnet_url,
            { memonic: account_1_mnemonic },
            { shardID: 0, chainId: 2 },
            { gasLimit: gasLimit, gasPrice: gasPrice }
        );
        const newAcc = truffleProvider.addByPrivateKey(account_1_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    mainnet: {
      network_id: "1",
      provider: () => {
        const truffleProvider = new TruffleProvider(
            mainnet_url,
            { memonic: account_2_mnemonic },
            { shardID: 0, chainId: 1 },
            { gasLimit: gasLimit, gasPrice: gasPrice }
        );
        const newAcc = truffleProvider.addByPrivateKey(account_2_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    eth: {
      //provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
      port: 9545,
      host: "127.0.0.1",
      network_id: "*"
   },
   // for truffle develop
   hmy: {
     host:"127.0.0.1",
     port: 8545,
     network_id: 20,
     accounts: 5,
     defaultEtherBalance: 500,
     blockTime: 0
   }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.5.17",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
