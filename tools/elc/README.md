# Horizon Ethereum Light Client (ELC) on Harmony
Ethereum Light Client (ELC) is a SPV-based light client implemented as a smart contract that receives and stores Ethereum block header information.

## Requirements
- nodejs 
- truffle
- solidity (solc)

## Installation instructions
1. `yarn` or `npm install`
2. `yarn libInit` or `npm run libInit`
3. `cp .env-example .env`  
   Update .env to include the private keys and ethereum node url(used to get block) you want to use.

## Compilation
```
truffle compile
```

## Deployment
> Run `source .env` if you haven't run it.
### Testnet
```
truffle migrate --reset --network testnet [--block=<ETH BLOCK NUMBER>]
```

### Mainnet
```
truffle migrate --reset --network mainnet [--block=<ETH BLOCK NUMBER>]
```

### Truffle Develop
1. Open a separate terminal then run the instructions:
```
truffle develop
```
2. deploy contract
```shell
truffle migrate --reset --network develop [--block=<ETH BLOCK NUMBER>]
```

## Testing
```
truffle test
```

## Tools
> Run `source .env` if you haven't run it.
### `./proofDump.js`
1. Generate DAG merkel tree  
    Generates a DAG merkel tree for the specified Epoch. The DAG merkel tree is in `./dag/<epoch>` directory.
    ```
    node ./proofDump.js --dag --epoch=<epoch number>
    ```
    example:`node ./proofDump.js --dag --epoch=387`
> 1. When you generate DAG merkel tree for a new epoch, it usually takes several hours.
> 2. Each epoch takes up 2GB+ of disk space.

2. Get root of a DAG merkel tree
    ```
    node ./proofDump.js --root --epoch=<epoch number>
    ```
    example:`node ./proofDump.js --root --epoch=387`

3. Get proof data of a ETH block
    ```
    node ./proofDump.js --proof --block=<ETH BLOCK NUMBER>
    ```
    example:`node ./proofDump.js --proof --block=11610001`

### `tools/MerkelRootSol.js`
Generate `MerkelRoot.sol` from `MerkelRoot.json`.
1. Update the DAG roots and the starting epoch number in `MerkelRoot.json`.
2. `node tools/MerkelRootSol.js -o contracts/ethash/MerkelRoot.sol`

## Interaction CLI
> Run `source .env` if you haven't run it.
### `cli/client.js`
1. List all methods of the contract
    ```
    truffle --network=<NETWORK> exec ./client.js --list
    ```
2. Call a method of the contract
    ```
    truffle --network=<NETWORK> exec ./client.js [--elc=CONTRACT ADDRESS] --func=<METHOD> [--argv argv1 argv2...] 
    ```
    example:`truffle --network=develop exec ./client.js --func=blocksByHeight --argv 11610000 0`

### `cli/eth2one-relay.js`
1. Relay a block to the light client contract.
    ```
    truffle --network=<NETWORK> exec ./eth2one-relay.js [--elc=CONTRACT ADDRESS] [--block=<ETH BLOCK NUMBER>]
    ```
    example:`truffle --network=develop exec ./eth2one-relay.js`