const Prime = artifacts.require("Prime");
const CacheSize = require("./data/CacheSize.json");
const FullSize = require("./data/FullSzie.json");
const MixBytes = 128;
const HashBytes = 64;

const RndInt = N=>Math.floor(Math.random()*N);

const TestCount = 100;
describe("Prime CacheSize test", async accounts => {
    it(`test ${TestCount} random CacheSize prime`, async () => {
        const prime = await Prime.deployed();
        const start = RndInt(CacheSize.length - TestCount);
        const sizeSlice = CacheSize.slice(start, start + TestCount);
        for(let i = 0; i < sizeSlice.length; i++) {
            const size = sizeSlice[i];
            assert.equal(await prime.probablyPrime(size, 2), false);
            assert.equal(await prime.probablyPrime(Math.floor(size/HashBytes), 2), true);
        }
    });
});

describe("Prime FullSize test", async accounts => {
    it(`test ${TestCount} random FullSize prime`, async () => {
        const prime = await Prime.deployed();
        const start = RndInt(FullSize.length - TestCount);
        const sizeSlice = FullSize.slice(start, start + TestCount);
        for(let i = 0; i < sizeSlice.length; i++) {
            const size = sizeSlice[i];
            assert.equal(await prime.probablyPrime(size, 2), false);
            assert.equal(await prime.probablyPrime(Math.floor(size/MixBytes), 2), true);
        }
    });
});