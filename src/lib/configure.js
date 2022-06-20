const { ethers } = require('hardhat')
const Web3 = require('web3')
const config = require('../../config.js')

let tokenLockerOnEthereum, TokenLockerOnEthereum
let faucetToken, FaucetToken
const web3 = new Web3(
    new Web3.providers.HttpProvider(config.ethURL)
)
const options = {
    gasLimit: config.gasLimit,
    gasPrice: config.gasPrice
}

async function mintFaucet () {
    FaucetToken = await ethers.getContractFactory('FaucetToken')
    faucetToken = await FaucetToken.attach(config.erc20)

    await faucetToken.mint()
}

async function configureEthSide () {
    // set otherside locker to self for testing purpose
    await tokenLockerOnEthereum.bind(config.hmyTokenLocker, options)
}

// npx hardhat run --network kovan scripts/configure.js
async function main () {
    TokenLockerOnEthereum = await ethers.getContractFactory(
        'TokenLockerOnEthereum'
    )
    tokenLockerOnEthereum = await TokenLockerOnEthereum.attach(
        config.ethTokenLocker
    )

    await configureEthSide()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
