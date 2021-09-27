require("@nomiclabs/hardhat-truffle5");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const HARMONY_PRIVATE_KEY = "";

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        localnet: {
            url: `https://api.s0.b.hmny.io`,
            accounts: [`0x${HARMONY_PRIVATE_KEY}`]
        },
        testnet: {
            url: `https://api.s0.b.hmny.io`,
            accounts: [`0x${HARMONY_PRIVATE_KEY}`]
        },
        mainnet: {
            url: `https://api.harmony.one`,
            accounts: [`0x${HARMONY_PRIVATE_KEY}`]
        }
    },
    solidity: {
        version: "0.7.3",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./build"
    },
    mocha: {
        timeout: 20000
    }
}
