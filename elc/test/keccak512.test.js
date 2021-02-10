const Keccak512 = artifacts.require("Keccak512");
const { Keccak } = require('sha3');
const randomBytes = require('randombytes');

function sha3_512(str) {
    const hash = new Keccak(512);
    hash.update(str);
    return '0x'+hash.digest('hex');
}

const TestCount = 10;

describe("Keccak512 test", async accounts => {
    it(`test ${TestCount} times`, async () => {
        const sha3 = await Keccak512.deployed();
        for(let i = 0; i < TestCount; i++) {
            const input = randomBytes(i&1?40:64);
            const contractResult = await sha3.sha3_512(input);
            const expectedResult = sha3_512(input);
            assert.equal(contractResult, expectedResult, '0x'+input.toString('hex'));
        }
    });
  });