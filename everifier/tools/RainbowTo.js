const RainbowOnes = artifacts.require("RainbowOnes");
const BridgedToken = artifacts.require("BridgedToken");

async function main(){
    c = await RainbowOnes.deployed();
    const erc20Add = JSON.parse(process.argv[5])
    const to = JSON.parse(process.argv[6])
    const amount = JSON.parse(process.argv[7])
    const erc20 = await BridgedToken.at(erc20Add)
    await erc20.approve(c.address, amount)
    const t = await c.RainbowTo(erc20.address, to, amount)
    console.log(t.tx)
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
