const Keccak512 = artifacts.require("Keccak512");
const { Keccak } = require('sha3');
const randomBytes = require('randombytes');

const D = console.log;
const toHex = web3.utils.asciiToHex;


function sha3_512(str) {
    const hash = new Keccak(512);
    hash.update(str);
    return '0x'+hash.digest('hex');
}

async function main() {
    const sha3 = await Keccak512.new();
    D(`contarct: ${sha3.address}`);

    const test = async input=> {
        const ret = await sha3.sha3_512(input);
        return ret == sha3_512(input);
    }

    for(let i = 0; i < 10; i++){
        const input = randomBytes(i&1?40:64);
        if(false == await test(input)) {
            throw "error: not equal!";
        }
        D(i);
    }
    D("success");
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
