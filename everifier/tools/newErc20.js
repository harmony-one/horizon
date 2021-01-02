const RainbowOnes = artifacts.require("RainbowOnes");
const BridgedToken = artifacts.require("BridgedToken");

async function main(){
    const walletAddress = (await web3.eth.getAccounts())[0];
    const c = await BridgedToken.new("xxx", "xxxx", 6);
    c.mint(walletAddress, 10000);
    console.log(c.address);
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
