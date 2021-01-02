const RainbowOnes = artifacts.require("RainbowOnes");

async function main(){
    c = await RainbowOnes.deployed();
    //await c.bandBridgeSide('0x445bc243dfeec49074831087d183Eb749F92ad2f');
    //t = await c.ExecProof(...arg)
    console.log(c.address)
}




module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
