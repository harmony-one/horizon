const RainbowOnes = artifacts.require("RainbowOnes");

async function main(){
    c = await RainbowOnes.deployed();
    const proof = JSON.parse(process.argv[5])
    const t = await c.ExecProof(...proof)
    console.log(t.tx)
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
