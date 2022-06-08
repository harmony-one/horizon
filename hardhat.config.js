require("dotenv").config();
// require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require('@openzeppelin/hardhat-upgrades');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const HARMONY_PRIVATE_KEY = process.env.PRIVATE_KEY;
<<<<<<< HEAD
const PROJECT_ID = process.env.INFURA_PROJECT_ID
=======
const PROJECT_ID = process.env.PROJECT_ID;
>>>>>>> upstream/main

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        develop: {
            url: `http://localhost:8545`
        },
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
        kovan: {
            url: `https://kovan.infura.io/v3/${PROJECT_ID}`,
            accounts: [`0x${HARMONY_PRIVATE_KEY}`]
        },
        ropsten: {
            url: `https://ropsten.infura.io/v3/${PROJECT_ID}`,
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
