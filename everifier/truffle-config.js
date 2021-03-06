/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const { TruffleProvider } = require('@harmony-js/core')

//Testnet
const testnet_mnemonic = process.env.TESTNET_MNEMONIC
const testnet_private_key = process.env.TESTNET_PRIVATE_KEY
const testnet_url = process.env.TESTNET_0_URL

//Mainnet
const mainnet_mnemonic = process.env.MAINNET_MNEMONIC
const mainnet_private_key = process.env.MAINNET_PRIVATE_KEY
const mainnet_url = process.env.MAINNET_0_URL;

//GAS - Currently using same GAS accross all environments
gasLimit = process.env.GAS_LIMIT
gasPrice = process.env.GAS_PRICE


// huobi
var HDWalletProvider = require("@truffle/hdwallet-provider");
const ETH_NODE_URL = 'https://http-testnet.hecochain.com'
//const ETH_NODE_URL = 'https://ropsten.infura.io/v3/ef2ba412bbaf499191f98908f9229490'
const PRIKEY = "38242392357b4318aa70216c28138c9f103b462baa72cd946170e4aa21eb7279"

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    testnet: {
      network_id: '2', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          testnet_url,
          { memonic: testnet_mnemonic },
          { shardID: 0, chainId: 2 },
          { gasLimit: gasLimit, gasPrice: gasPrice},
        );
        const newAcc = truffleProvider.addByPrivateKey(testnet_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    mainnet: {
      network_id: '1', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          mainnet_url,
          { memonic: mainnet_mnemonic },
          { shardID: 0, chainId: 1 },
          { gasLimit: gasLimit, gasPrice: gasPrice },
        );
        const newAcc = truffleProvider.addByPrivateKey(mainnet_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    // Useful for private networks ganache-cli or geth
    local: {
       //provider: () => new HDWalletProvider(mnemonic, `https://network.io`),
       port: 8545,
       host: "127.0.0.1",
       network_id: "*"
    },
    // for truffle develop
    develop: {
      host:"127.0.0.1",
      port: 8545,
      network_id: '*',
      accounts: 5,
      defaultEtherBalance: 500,
      blockTime: 0
    }

  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
     timeout: 1000000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.2",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      // settings: {          // See the solidity docs for advice about optimization and evmVersion
      //  optimizer: {
      //    enabled: false,
      //    runs: 200
      //  },
      //  evmVersion: "byzantium"
      // }
    }
  }
}
