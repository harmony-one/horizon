# Horizon Bridge Documentation and API reference

## Environment Data

Here is an overview of Environment data setup for testing after following the steps below

* Deployer Address : 0x8875fc2A47E35ACD1784bB5f58f563dFE86A8451
* Infura Project: 32cb9c57bfe447a99ea34e30195b2d10
* KOVAN ERC20 Contract: [0xc90a6555CaD53a9D85a80052Fe2926E21608CF41](https://kovan.etherscan.io/address/0xc90a6555cad53a9d85a80052fe2926e21608cf41)

# Getting started

## Setting up the codebase

### Install the tools and the cli

```
cd ./tools
cd elc
yarn install
cd ../eprover
yarn install
cd ../eth2hmy-relay
yarn install
cd ../../cli
yarn install
```

## Setting up the Infrastructure 

### Deployer Account
Create a deployer account and fund it in both Harmony Testnet and Kovan using Faucets. Add the PRIVATE_KEY to the `.env` file

### Infura Project Setup

Create an [Infura Account](https://infura.io/) and create an ethereum project. Add the INFURA_PROJECT_ID to the `.env` file.


## Deploying Smart Contracts

### Deploy the ERC20 Contract on Kovan

```
npx hardhat run --network kovan scripts/deploy_erc20.js
ERC20 deployed to: 0xD86eE1D13A1C34B5b2B08e1710f41a954A42D7fC
```

## Creating the DAG Merkle Tree

## Deploying the Relayer

## Deploying the Client

## Transfer Tokens

# Running Tests
Tests are set up in the tests folder and are run using hardhat.

`yarn test` is set up as a script to run `npx hardhat test`




### Use the Horizon CLI to setup and run the bridge

#### Horizon CLI
CLI is a utility that provides a command-line interface to all the components to the Horizon bridge and allow performing end-to-end bridge functionalities.

#### CLI Help Infomation
`node index.js [command] -h`

#### DAG Merkel Tree CLI
1. `node index.js dagProve generate` which calculate merkle root for epochs from [start, start+n)
```
node index.js dagProve generate 377
```
Notes: to find the latest epoch you can look at [explorer](https://staking.harmony.one/validators/testnet/one1fxazl9qk7c30mk3lp7tun4yepptwvfq9ss28u7) for a validater and see the latest epoch on the EXPECTED RETURN HISTORY GRAPH. For example in Harmony Testner on May 18th 2022, the latest epoch was 75762 so to generate the merkle root would need to run the following `node index.js dagProve generate 75762`.

However running this gives the following error
```
johnlaptop cli (main) $ node index.js dagProve generate 75762
generate epoch: 75762

<--- Last few GCs --->

[67456:0x110008000]   450175 ms: Scavenge 4074.6 (4089.5) -> 4067.6 (4090.0) MB, 6.5 / 0.3 ms  (average mu = 0.257, current mu = 0.235) allocation failure
[67456:0x110008000]   450217 ms: Scavenge 4075.0 (4090.0) -> 4068.0 (4090.3) MB, 5.6 / 0.3 ms  (average mu = 0.257, current mu = 0.235) allocation failure
[67456:0x110008000]   450250 ms: Scavenge 4075.4 (4090.3) -> 4068.4 (4090.8) MB, 4.0 / 0.1 ms  (average mu = 0.257, current mu = 0.235) allocation failure


<--- JS stacktrace --->

FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
 1: 0x10130d6e5 node::Abort() (.cold.1) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 2: 0x1000b1c49 node::Abort() [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 3: 0x1000b1daf node::OnFatalError(char const*, char const*) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 4: 0x1001f60f7 v8::Utils::ReportOOMFailure(v8::internal::Isolate*, char const*, bool) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 5: 0x1001f6093 v8::internal::V8::FatalProcessOutOfMemory(v8::internal::Isolate*, char const*, bool) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 6: 0x1003a54f5 v8::internal::Heap::FatalProcessOutOfMemory(char const*) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 7: 0x1003a6fba v8::internal::Heap::RecomputeLimits(v8::internal::GarbageCollector) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 8: 0x1003a2689 v8::internal::Heap::PerformGarbageCollection(v8::internal::GarbageCollector, v8::GCCallbackFlags) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
 9: 0x10039ff21 v8::internal::Heap::CollectGarbage(v8::internal::AllocationSpace, v8::internal::GarbageCollectionReason, v8::GCCallbackFlags) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
10: 0x10039ee98 v8::internal::Heap::HandleGCRequest() [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
11: 0x10035ae71 v8::internal::StackGuard::HandleInterrupts() [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
12: 0x1006fb7b7 v8::internal::Runtime_StackGuardWithGap(int, unsigned long*, v8::internal::Isolate*) [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
13: 0x100a893d9 Builtins_CEntry_Return1_DontSaveFPRegs_ArgvOnStack_NoBuiltinExit [/Users/john/.nvm/versions/node/v14.17.0/bin/node]
Abort trap: 6
```

2. `node index.js dagProve blockProof` which accepts block number to calculate all necessary information in order to prove the block
```
node index.js dagProve blockProof --block 11266784 --url https://ropsten.infura.io/v3/<project-id>
```

#### ELC(Ethereum Ligth Client) CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ELC deploy` deploy ELC contract to Harmony network.
```
node index.js ELC deploy http://localhost:9500 --url https://ropsten.infura.io/v3/<project-id> --block 11266872
```
2. `node index.js ELC status` display last block of ELC.
```
node index.js ELC status http://localhost:9500 <ELC_Contract_Addr>
```

#### Ethereum Block Relay CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ethRelay getBlockHeader` get block header from ethereum.
```
node index.js ethRelay getBlockHeader https://ropsten.infura.io/v3/<project-id> 11266872
```
2. `node index.js ethRelay relay` constantly relay blocks from Ethereum to Harmony.

#### Ethereum Receipt Prove CLI
1. `node index.js EProver proof` get the proof data of the receipt of the transaction.

#### Ethereum Receipt Verifier CLI
1. `node index.js EVerifier deploy` deploy EVerifier library contract to Harmony network.
2. `node index.js EVerifier verify` verify receipt MPT proof vai everifier contract, return receipt.

#### Bridge CLI
1. `node index.js Bridge deploy` deploy bridge contract both on etheruem and harmony.
2. `node index.js Bridge deployFaucet` deploy a faucet ERC20 token for testing.
3. `node index.js Brodge deployFakeClient` deploy a fake lightclient for testing.
4. `node index.js Bridge change` change light client contract, only owner has access.
5. `node index.js Bridge map` map ERC20 from ethereum to harmony.
6. `node index.js Bridge crossTo` cross transfer ERC20 from ethereum to harmony.
7. `node index.js Bridge crossBack` cross transfer HRC20 from harmony back to ethereum.


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
