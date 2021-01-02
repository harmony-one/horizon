const RainbowOnes = artifacts.require("RainbowOnes");

async function main(){
    c = await RainbowOnes.deployed();
    const otherSideAddress = process.argv[5]
    await c.bandBridgeSide(otherSideAddress);
    console.log(c.address , "==>", await c.otherSideBridge())
    walletAddress = (await web3.eth.getAccounts())[0];
    console.log(walletAddress)
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
