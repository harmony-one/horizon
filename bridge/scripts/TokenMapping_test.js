const GateManager = artifacts.require("GateManager");
const Gateway = artifacts.require("Gateway");
const EventRouter = artifacts.require("EventRouter");
const BridgedToken = artifacts.require("BridgedToken");
const {Bridge} = require("../lib/Bridge.js");
const {CrossRelay} = require("../lib/CrossRelay.js");
const {ContractAt} = require("../lib/Contract.js");

const D = console.log;

async function main() {
    const manager = await GateManager.deployed();
    D("manager:", manager.address);
    const chainType = await manager.chainType();
    const gateSize = await manager.GateSize();
    const gates = [];
    for(let i = 0; i < gateSize; i++) {
        const gateAddress = await manager.Gates(i);
        const gate = await Gateway.at(gateAddress);
        const chainType = await gate.chainType();
        const routerAddress = await manager.GateRouter(chainType);
        const router = await EventRouter.at(routerAddress);
        const bridge = new Bridge(web3, router);
        gates.push({chainType, gate,router, bridge});
    }
    const {bridge, gate} = gates[0];
    D("gate:", gate.address);
    const token = await BridgedToken.new("two","two",2);
    const mapReqTx = await gate.mapToken(token.address);

    D("CrossRelay-1")
    const mapAckTx = await CrossRelay(bridge, bridge, mapReqTx.tx);
    D("CrossRelay-2")
    await CrossRelay(bridge, bridge, mapAckTx.tx);
    D("CrossRelay-check...")
    const tokenSize = await gate.getMappedSize();
    const TxSize = tokenSize[0].toNumber();
    const RxSize = tokenSize[1].toNumber();
    for(let i = 0; i < RxSize; i++) {
        const tokenFrom = await gate.RxMappedList(i);
        const tokenTo = await gate.RxMappedForward(tokenFrom);
        D(`RxMapped:${i} (${tokenFrom}<=>${tokenTo})`);
    }
    for(let i = 0; i < TxSize; i++) {
        const tokenFrom = await gate.TxMappedList(i);
        const tokenTo = await gate.TxMappedForward(tokenFrom);
        const tokenInv = await gate.TxMappedInverse(tokenTo);
        D(`TxMapped:${i} (${tokenFrom}<=>${tokenTo}):${tokenInv}`);
    }

/*
    const sender = await (web3.eth.getAccounts())[0];
    await token.mint(sender, 2);
    
    gate.mapToken()
    const proof = await bridge.getProof(tx.tx);
    await bridge.execProof(proof);
    const chainGate = await gate.chainGate();
    D("bindGate:", chainGate);*/
}


module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
