## Steps:
1. install: `yarn` or `npm install`
2. library init: `yarn libInit` or `npm run libInit`
3. compile contract: `truffle compile`
4. start Ganache-cli: `ganache-cli -l 80000000`
5. test keccak512: `truffle --network=develop exec tools/keccak512.js`
6. test light client: `truffle --network=develop exec tools/client.js`

> When running `truffle --network=develop exec tools/client.js` for the first time, the merkel tree needs to be generated, which can take several hours.
