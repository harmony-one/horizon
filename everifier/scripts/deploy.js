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
        txHash = await hb.handleEthProof(proof)

        let mintToken = await hb.getNewTokenAddress(txHash)
        console.log("created token on harmony", mintToken)
        hb.addMintTokenContract(mintToken)
        contracts.hrcToken = mintToken

        console.log("fetch token ack proof from harmony and feed to ethereum")
        proof = await hb.getProof(txHash)
        let res = await eb.handleHmyProof(proof)

        console.log("success?", res.status)
    } catch (e) {
        console.log(e)
    }
    return contracts
}

deployContracts().then( (contracts) => {
    return setup(contracts)
}).then( contracts => {
    console.log(contracts)
    let jsData = JSON.stringify(contracts, null, 4)
    fs.writeFileSync('./build/deployed.json', jsData)
    console.log("contracts write to /build/deployed.json")
}).catch(err => console.log).finally(() =>process.exit())
