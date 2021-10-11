const { ethers } = require("hardhat");
const Web3 = require("web3");
require("dotenv").config();

let tokenLockerOnEthereum, TokenLockerOnEthereum;
let faucetToken, FaucetToken;
let web3 = new Web3(new Web3.providers.HttpProvider(process.env.ETH_NODE_URL));
let options = {
    gasLimit: process.env.GAS_LIMIT,
    gasPrice: process.env.GAS_PRICE
}

async function mintFaucet() {
    FaucetToken = await ethers.getContractFactory("FaucetToken");
    faucetToken = await FaucetToken.attach(
        process.env.ERC20
    );
    
    await faucetToken.mint();
}

async function configureEthSide() {
    // set otherside locker to self for testing purpose
    await tokenLockerOnEthereum.bind(process.env.HMY_TOKEN_LOCKER, options);

    // set lightclient to token locker
    // await tokenLockerOnEthereum.changeLightClient(process.env.HMY_LIGHT_CLIENT, options);
}


// npx hardhat run --network kovan scripts/configure.js
async function main() {
    TokenLockerOnEthereum = await ethers.getContractFactory("TokenLockerOnEthereum");
    tokenLockerOnEthereum = await TokenLockerOnEthereum.attach(
        process.env.ETH_TOKEN_LOCKER
    );

    await configureEthSide();

    // await mintFaucet();
    // let res = await tokenLockerOnEthereum.issueTokenMapReq(process.env.ERC20);
    // console.log(res);

    // await tokenLockerOnEthereum.lock(
    //     process.env.ERC20,
    //     process.env.WALLET_ADDRESS,
    //     web3.utils.toWei('100', 'ether'),
    //     options
    // ); 
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });