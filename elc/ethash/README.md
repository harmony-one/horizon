## Steps:
1. install: `yarn` or `npm install`
2. compile contract: `truffle compile`
3. start Ganache-cli: `ganache-cli -l 80000000`
4. test keccak512: `truffle --network=develop exec test/keccak512.js`
5. test ethash: `truffle --network=develop exec test/ethash.js`

## [Ethash][ethash]
Validating ETHASH requires random slices of a big DAG dataset and hashing them together.  
The full dataset is more than 4 GB, full clients and miners store it.  
For a light client, it stores only a 16MB pseudo-random cache and can use the cache to regenerate specific pieces of the full dataset needed for the computation.
One ethash calculation requires 64 random data pieces of the dataset, and each data pieces calculation requires two `keccak512` calculation.
There is one more hash operation, so 129 `keccak512` are required.

## Gas Usage
- keccak512: 1821994
- generate a data piece: 4236935 (includes two `keccak512`)
- ethash verify: 271667919

[ethash]: https://eth.wiki/en/concepts/ethash/ethash