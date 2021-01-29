const GateManager = artifacts.require("GateManager");
const Gateway = artifacts.require("Gateway");
const EventRouter = artifacts.require("EventRouter");
const BridgedToken = artifacts.require("BridgedToken");
const {Bridge} = require("../lib/Bridge.js");
const {CrossRelay} = require("../lib/CrossRelay.js");

const D = console.log;

async function main() {
    const manager = await GateManager.deployed();
    D("manager:", manager.address);
    //const chainType = await manager.chainType();
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
    const sender = (await web3.eth.getAccounts())[0];
    D("sender:", sender);
    D("---------Rx test");
    {
        const i = 0;
        const tokenFrom = await gate.RxMappedList(i);
        const tokenTo = await gate.RxMappedForward(tokenFrom);
        const tokenA = await BridgedToken.at(tokenFrom);
        const tokenB = await BridgedToken.at(tokenTo);
        D("tokenPair:", tokenA.address, tokenB.address);
        await tokenA.mint(sender, 2);
        {
            const balanceA = await tokenA.balanceOf(sender);
            const balanceB = await tokenB.balanceOf(sender);
            const balanceGateA = await tokenA.balanceOf(gate.address);
            const balanceGateB = await tokenB.balanceOf(gate.address);
            D(`before: ${balanceA}:${balanceB} ${balanceGateA}:${balanceGateB}`);
        }
        const transferTx = await tokenA.transfer(gate.address, 1);
        await CrossRelay(bridge, bridge, transferTx.tx);
        {
            const balanceA = await tokenA.balanceOf(sender);
            const balanceB = await tokenB.balanceOf(sender);
            const balanceGateA = await tokenA.balanceOf(gate.address);
            const balanceGateB = await tokenB.balanceOf(gate.address);
            D(`after: ${balanceA}:${balanceB} ${balanceGateA}:${balanceGateB}`);
        }
    }

    D("---------Tx test");
    {
        const i = 0;
        const tokenFrom = await gate.TxMappedList(i);
        const tokenTo = await gate.TxMappedForward(tokenFrom);
        const tokenA = await BridgedToken.at(tokenFrom);
        const tokenB = await BridgedToken.at(tokenTo);
        {
            const balanceA = await tokenA.balanceOf(sender);
            const balanceB = await tokenB.balanceOf(sender);
            const balanceGateA = await tokenA.balanceOf(gate.address);
            const balanceGateB = await tokenB.balanceOf(gate.address);
            D(`before: sender ${balanceA}:${balanceB} gate ${balanceGateA}:${balanceGateB}`);
        }
        const withdrawTx = await tokenB.transfer(gate.address, 1);
        await CrossRelay(bridge, bridge, withdrawTx.tx);
        {
            const balanceA = await tokenA.balanceOf(sender);
            const balanceB = await tokenB.balanceOf(sender);
            const balanceGateA = await tokenA.balanceOf(gate.address);
            const balanceGateB = await tokenB.balanceOf(gate.address);
            D(`after: sender ${balanceA}:${balanceB} gate ${balanceGateA}:${balanceGateB}`);
        }
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
