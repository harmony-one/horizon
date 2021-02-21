const GateManager = artifacts.require("GateManager");
const Gateway = artifacts.require("Gateway");
const EventRouter = artifacts.require("EventRouter");
const {Bridge} = require("../lib/Bridge.js");

const D = console.log;

async function main() {
    const manager = await GateManager.deployed();
    D("manager:", manager.address);
    const chainType = await manager.chainType();
    const tx = await manager.bindGateManager(chainType, manager.address);
    D(tx.tx);
    const gateSize = await manager.GateSize();
    const gates = [];
    for(let i = 0; i < gateSize; i++) {
        const gateAddress = await manager.Gates(i);
        const gate = await Gateway.at(gateAddress);
        const chainType = await gate.chainType();
        const routerAddress = await manager.GateRouter(chainType);
        const router = await EventRouter.at(routerAddress);
        D("owner:", await router.owner());
        const bridge = new Bridge(web3, router);
        gates.push({chainType, gate,router, bridge});
        const chainGate = await gate.chainGate();
        D("bindGate-1:", chainGate);
    }
    const {bridge, gate} = gates[0];
    D("gate:", gate.address);
    const proof = await bridge.getProof(tx.tx);
    await bridge.execProof(proof);
    const chainGate = await gate.chainGate();
    D("bindGate:", chainGate);
}


module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
