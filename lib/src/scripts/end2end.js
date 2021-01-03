const contracts = require("../build/deployed.json");
const HmyBridge = require("../lib/HmyBridge");
const EthBridge = require("../lib/EthBridge");
const BN = require("bn.js");
const BigNumber = require("bignumber.js");

const eb = new EthBridge(contracts.ercToken, contracts.ethBridge)
const hb = new HmyBridge(contracts.hmyBridge, contracts.hrcToken)

async function eth2Hmy() {
    try {
        console.log("====================== Lock in Ethereum ==========================")
        let initialBal = await eb.getBalance(eb.userAccount.address)
        console.log("initial erc20 balance: ", initialBal)

        let amount = new BigNumber(1e18)
        await eb.mint(eb.userAccount.address, amount)

        let mintBal = await eb.getBalance(eb.userAccount.address)
        console.log("mint erc20 token: ", mintBal)

        console.log("approving token")
        await eb.approve(contracts.ethBridge, amount)

        console.log("locking token")
        let locked = await eb.lock(hb.userAccount.address, amount)
        console.log("token locked", locked)

        let finalBal = await eb.getBalance(eb.userAccount.address)
        console.log("final erc20 balance: ", finalBal)

        let proof = await eb.getProof(locked)

        console.log("====================== Mint on Harmony ==========================")

        let initialHmyBal = await hb.getBalance(hb.userAccount.address)
        console.log("initial hrc20 balance: ", initialHmyBal.toString())

        console.log("minting on Harmony")
        let txHash = await hb.handleEthProof(proof)

        let finalHmyBal = await hb.getBalance(hb.userAccount.address)
        console.log("after hrc20 balance: ", finalHmyBal.toString())
    } catch (e) {
        console.log(e)
    }
}

// hmy2Eth must be called after eth2Hmy
async function hmy2Eth() {
    try {
        console.log("====================== Burn on Harmony ==========================")
        let initialBal = await hb.getBalance(hb.userAccount.address)
        console.log("initial erc20 balance: ", initialBal.toString())

        console.log("approving token")
        let amount = new BN(10).pow(new BN(18))
        await hb.approve(contracts.hmyBridge, amount)

        console.log("locking token")
        let txHash = await hb.lock(eb.userAccount.address, amount)
        console.log("token locked", txHash)

        let finalBal = await hb.getBalance(eb.userAccount.address)
        console.log("final erc20 balance: ", finalBal.toString())

        let proof = await hb.getProof(txHash)

        console.log("====================== Unlock on Ethereum ==========================")

        let initialHmyBal = await eb.getBalance(eb.userAccount.address)
        console.log("initial erc20 balance: ", initialHmyBal)

        console.log("minting on Ethereum")
        txHash = await eb.handleHmyProof(proof)
        console.log(txHash)

        let finalHmyBal = await eb.getBalance(eb.userAccount.address)
        console.log("after erc20 balance: ", finalHmyBal)
    } catch (e) {
        console.log(e)
    }
}

// eth2Hmy().catch( (err) => console.log ).finally(() => process.exit())
eth2Hmy().then( () => {
    return hmy2Eth()
}).catch( (err) => console.error ).finally(() => process.exit())
