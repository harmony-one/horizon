const RainbowOnes = artifacts.require("RainbowOnes");
const BridgedToken = artifacts.require("BridgedToken");

async function main(){
    const erc20addr = process.argv[5];
    const erc20 = await BridgedToken.at(erc20addr);
    const c = await RainbowOnes.deployed();
    tx = await c.CreateRainbow(erc20.address);
    console.log(tx.tx);
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
