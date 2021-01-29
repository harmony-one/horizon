const { TruffleProvider } = require('@harmony-js/core')

//GAS - Currently using same GAS accross all environments
const gasLimit = "0x7a1200"
const gasPrice = "0x3b9aca00"




var HDWalletProvider = require("@truffle/hdwallet-provider");
const ETH_NODE_URL = 'https://mainnet.infura.io/v3/ef2ba412bbaf499191f98908f9229490'
//const ETH_NODE_URL = 'https://ropsten.infura.io/v3/ef2ba412bbaf499191f98908f9229490'
const PRIKEY = "38242392357b4318aa70216c28138c9f103b462baa72cd946170e4aa21eb7279"

TESTNET_MNEMONIC = 'urge clog right example dish drill card maximum mix bachelor section select'
//https://api.infura.io/v1/jsonrpc/mainn
module.exports = {
  networks: {
    ethmain:{
      provider: function () {
        // mnemonic表示MetaMask的助记词。 "ropsten.infura.io/v3/33..."表示Infura上的项目id
        return new HDWalletProvider(PRIKEY, ETH_NODE_URL);   // 1表示第二个账户(从0开始)
      },
      network_id: "*",  // match any network
      gas: 4529340,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true,     // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 100000000
    },
    ropsten: {
      provider: function () {
        // mnemonic表示MetaMask的助记词。 "ropsten.infura.io/v3/33..."表示Infura上的项目id
        return new HDWalletProvider(PRIKEY, ETH_NODE_URL);   // 1表示第二个账户(从0开始)
      },
      network_id: "*",  // match any network
      gas: 4529340,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true,     // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 100000000
    },
    testnet: {
      network_id: '2', // Any network (default: none)
      networkCheckTimeout: 10000,
      provider: () => {
        const truffleProvider = new TruffleProvider(
          "https://api.s0.b.hmny.io",
          { memonic: TESTNET_MNEMONIC },
          { shardID: 0, chainId: 2 },
          { gasLimit: gasLimit, gasPrice: gasPrice },
        );
        const newAcc = truffleProvider.addByPrivateKey(PRIKEY);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    hmymain: {
      network_id: '1', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          "https://api1.s0.t.hmny.io",
          { shardID: 0, chainId: 1 },
          { gasLimit: gasLimit, gasPrice: gasPrice },
        );
        const newAcc = truffleProvider.addByPrivateKey(PRIKEY);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },

    // for truffle develop
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      accounts: 5,
      defaultEtherBalance: 500,
      blockTime: 0
    },
    eth: {
      //provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
      port: 9545,
      host: "127.0.0.1",
      network_id: "*"
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.6.2",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
