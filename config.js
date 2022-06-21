require('dotenv').config()

module.exports = {
    localnetPrivateKey: process.env.LOCALNET_PRIVATE_KEY,
    localgethPrivateKey: process.env.LOCALGETH_PRIVATE_KEY,
    hardhatPrivateKey: process.env.HARDHAT_PRIVATE_KEY,
    hardhatURL: process.env.HARDHAT_URL,
    localnetURL: process.env.LOCALNET_URL,
    devnetURL: process.env.DEVNET_URL,
    testnetURL: process.env.TESTNET_URL,
    mainnetURL: process.env.MAINNET_URL,
    localgethURL: process.env.LOCALGETH_URL,
    ropstenURL: process.env.ROPSTEN_URL,
    ethereumURL: process.env.ETHEREUM_URL,
    etherscanAPI: process.env.ETHERSCAN_API_KEY,
    privateKey: process.env.PRIVATE_KEY,
    hmyURL: process.env.HMY_URL,
    ethURL: process.env.ETH_URL,
    gasLimit: process.env.GAS_LIMIT,
    gasPrice: process.env.GAS_PRICE,
    erc20: process.env.ERC20,
    hmyTokenLocker: process.env.HMY_TOKEN_LOCKER,
    ethTokenLocker: process.env.ETH_TOKEN_LOCKER,
    verbose: process.env.VERBOSE === 'true' || process.env.VERBOSE === '1',
    reportGas: false,
    hlcInitialBlock: process.env.HLC_INITIAL_BLOCK,
    // use JSON.parse to parse the array of relayers
    relayers: JSON.parse(process.env.RELAYERS),
    threshold: process.env.THRESHOLD,
    elcInitialBlock: process.env.ELC_INIITAL_BLOCK
}
