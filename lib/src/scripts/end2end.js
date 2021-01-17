const contracts = require("../build/deployed.json");
const HmyBridge = require("../lib/HmyBridge");
const EthBridge = require("../lib/EthBridge");
const BN = require("bn.js");
const BigNumber = require("bignumber.js");

const eb = new EthBridge(contracts.ercToken, contracts.ethBridge)
const hb = new HmyBridge(contracts.hmyBridge, contracts.hrcToken)

async function eth2Hmy() {
    try {
        console.log(" \n ====================== Lock in Ethereum ==========================")
        let initialBal = await eb.getBalance(eb.userAccount.address)
        console.log(" \n initial erc20 balance: ", initialBal)

        let amount = new BigNumber(1e18)
        await eb.mint(eb.userAccount.address, amount)

        let mintBal = await eb.getBalance(eb.userAccount.address)
        console.log(" \n mint erc20 token: ", mintBal)

        console.log(" \n approving erc20 token so it can be locked ")
        await eb.approve(contracts.ethBridge, amount)

        console.log(" \n locking token on ETH chain")
        let lockedTxHash = await eb.lock(hb.userAccount.address, amount)
        console.log("lock token tx hash on ETH chain: ", lockedTxHash)

        let finalBal = await eb.getBalance(eb.userAccount.address)
        console.log(" \n final erc20 balance after token lock: ", finalBal)

        console.log(" \n send erc20 token lock tx hash to EProver and receive proof-of-lock")
        let proof = await eb.getProof(lockedTxHash)

        console.log(" \n ====================== Mint on Harmony ==========================")

        let initialHmyBal = await hb.getBalance(hb.userAccount.address)
        console.log(" \n initial hrc20 balance: ", initialHmyBal.toString())

        
        // wait until eth block is relayed to ethClient on harmony chain
          
        await hb.waitBlockHashSafeOnEthClient(lockedTxHash)
        
        console.log(" \n send the proof-of-lock to bridge smart contract( invokes ELC and EVerifier)  on Harmony")
        let txHash = await hb.handleEthProof(proof)
        console.log(" \n verified the proof-of-lock and mint HRC20 (equivalent amount) txHash on HMY chain: "+ txHash)

        let finalHmyBal = await hb.getBalance(hb.userAccount.address)
        console.log(" \n after hrc20 balance: ", finalHmyBal.toString())
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

eth2Hmy().catch( (err) => console.log ).finally(() => process.exit())
// eth2Hmy().then( () => {
//     return hmy2Eth()
// }).catch( (err) => console.error ).finally(() => process.exit())
