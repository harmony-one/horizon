import * as dotenv from 'dotenv'

import { HardhatUserConfig, task } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'
import '@primitivefi/hardhat-dodoc'
import 'hardhat-abi-exporter'
import '@atixlabs/hardhat-time-n-mine'
import 'hardhat-spdx-license-identifier'
import 'hardhat-deploy'
import '@openzeppelin/hardhat-upgrades'

dotenv.config()

const LOCALNET_PRIVATE_KEY = process.env.LOCALNET_PRIVATE_KEY
const DEVNET_PRIVATE_KEY = process.env.DEVNET_PRIVATE_KEY
const TESTNET_PRIVATE_KEY = process.env.TESTNET_PRIVATE_KEY
const MAINNET_PRIVATE_KEY = process.env.MAINNET_PRIVATE_KEY
const LOCALGETH_PRIVATE_KEY = process.env.LOCALGETH_PRIVATE_KEY
// const HARDHAT_PRIVATE_KEY = process.env.HARDHAT_PRIVATE_KEY
const ROPSTEN_PRIVATE_KEY = process.env.ROPSTEN_PRIVATE_KEY
const ETHEREUM_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY
const LOCALNET_URL = process.env.LOCALNET_URL
const DEVNET_URL = process.env.DEVNET_URL
const TESTNET_URL = process.env.TESTNET_URL
const MAINNET_URL = process.env.MAINNET_URL
const LOCALGETH_URL = process.env.LOCALGETH_URL
const ROPSTEN_URL = process.env.ROPSTEN_URL
const ETHEREUM_URL = process.env.ETHEREUM_URL
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
        console.log(account.address)
    }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.9',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    namedAccounts: {
        deployer: 0,
        relayer: 1,
        alice: 2,
        bob: 3,
        carol: 4
    },
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            mining: {
                auto: false,
                interval: 2000
            }
        },
        localnet: {
            url: LOCALNET_URL,
            accounts: [`0x${LOCALNET_PRIVATE_KEY}`],
            gasPrice: 20000000000,
            gas: 6000000
        },
        devnet: {
            url: DEVNET_URL,
            accounts: [`0x${DEVNET_PRIVATE_KEY}`],
            chainId: 1666900000,
            live: true,
            saveDeployments: true,
            tags: ['staging'],
            gas: 2100000,
            gasPrice: 5000000000,
            gasMultiplier: 2
        },
        testnet: {
            url: TESTNET_URL,
            accounts: [`0x${TESTNET_PRIVATE_KEY}`],
            chainId: 1666700000,
            live: true,
            saveDeployments: true,
            tags: ['staging'],
            gas: 2100000,
            gasPrice: 5000000000,
            gasMultiplier: 2
        },
        mainnet: {
            url: MAINNET_URL,
            accounts: [`0x${MAINNET_PRIVATE_KEY}`]
        },
        localgeth: {
            url: LOCALGETH_URL,
            accounts: [`0x${LOCALGETH_PRIVATE_KEY}`],
            gasPrice: 20000000000,
            gas: 6000000
        },
        ropsten: {
            url: ROPSTEN_URL,
            accounts: [`0x${ROPSTEN_PRIVATE_KEY}`],
            chainId: 3,
            live: true,
            saveDeployments: true,
            tags: ['staging'],
            gasPrice: 20000000000,
            gas: 6000000,
            gasMultiplier: 2
        },
        ethereum: {
            url: ETHEREUM_URL,
            accounts: [`0x${ETHEREUM_PRIVATE_KEY}`],
            gasPrice: 120 * 1000000000,
            chainId: 1
        }
    },
    gasReporter: {
        enabled: process.env.REPORT_GAS !== undefined,
        currency: 'USD'
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY
    },
    dodoc: {
        runOnCompile: true,
        debugMode: false,
        outputDir: 'docs/solidity'
    },
    abiExporter: {
        path: './data/abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 2,
        pretty: true
    },
    spdxLicenseIdentifier: {
        overwrite: true,
        runOnCompile: true
    },
    paths: {
        sources: './contracts',
        tests: './test',
        cache: './cache',
        artifacts: './build'
    },
    mocha: {
        timeout: 20000
    }
}

export default config
