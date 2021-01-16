const EthBridge = require('../lib/EthBridge')
const HmyBridge = require('../lib/HmyBridge')
const fs = require('fs')

let eb = new EthBridge()
let hb = new HmyBridge()

async function deployContracts() {
    let ercToken, ethBridge, hrcToken, hmyBridge
    try {
        ercToken = await eb.deployToken()
        ethBridge = await eb.deployBridge()
        hmyBridge = await hb.deployBridge()
    } catch (e) {
        console.error(e)
    }

    return {
        ercToken: ercToken,
        ethBridge: ethBridge,
        hmyBridge: hmyBridge,
    }
}

async function setup(contracts) {
    try {
        console.log("adding harmony bridge on ethereum")
        await eb.addHarmonyBridge(contracts.hmyBridge)

        console.log("adding ethereum bridge on harmony")
        await hb.addEthBridge(contracts.ethBridge)

        console.log("adding token at ethereum")
        let txHash = await eb.addToken(contracts.ercToken)
       
        console.log("fetch add token proof from ethereum and feed to harmony")
        let proof = await eb.getProof(txHash)

        // wait until eth block is relayed to ethClient on harmony chain
        await hb.waitBlockHashSafeOnEthClient(txHash)
        txHash = await hb.handleEthProof(proof)
         
        let mintToken = await hb.getNewTokenAddress(txHash)
        console.log("created token on harmony: " +  mintToken+ " by handling eth proof on hmy chain with txHash "+ txHash)
        
        hb.addMintTokenContract(mintToken)
        contracts.hrcToken = mintToken

        //unable to get merkle-proofs from harmony,  "hmy_getReceipt" json rpc method does not exist 
        // console.log("fetch token ack proof from harmony and feed to ethereum")
        // proof = await hb.getProof(txHash)
        // let res = await eb.handleHmyProof(proof)

        // console.log("success?", res.status)
    } catch (e) {
        console.log(e)
    }
    return contracts
}

deployContracts().then( (contracts) => {
    console.log(contracts)
    return setup(contracts)
}).then( contracts => {
    console.log(contracts)
    let jsData = JSON.stringify(contracts, null, 4)
    fs.writeFileSync('./build/deployed.json', jsData)
    console.log("contracts write to /build/deployed.json")
}).catch(err => console.log).finally(() =>process.exit())



// deploy can take a while if you have a bad internet
// use in case of already deployed and just setup the bridges, add tokens, handle proofs so tokens are ready to be transferred.

// setup({
//     ercToken: '0x45E48ED0A63fBa81119Ab42d519857866677D97d',
//     ethBridge: '0xE3e2d725626BF766C14Ed4a222505C968B060d13',
//     hmyBridge: '0xff7e11eb1cc3cf2904111535ceef3c550fb18633'
//   }
//   ).then( contracts => {
//         console.log(contracts)
//         let jsData = JSON.stringify(contracts, null, 4)
//         fs.writeFileSync('./build/deployed.json', jsData)
//         console.log("contracts write to /build/deployed.json")
//     }).catch(err => console.log).finally(() =>process.exit())

