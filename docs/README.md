# Horizon Bridge Documentation and API reference

# Overview

The current state of the project is that we are testing using a Harmony Local Node and brdiging to Ropsten. For the client we will use the CLI and moving forward will use the new UI
* DAG genertion : Takes several hours to run Ganesha has a machine to do this and shares the latest DAG info from Ropsten using [google drive](https://drive.google.com/file/d/1FqLCO5oc1xDYNMuub7xAqnb6kfohdf-U/view?usp=sharing). The epoch logic is the block Number divided by 30,000 so current Ropsten EPOCH is block 12280236 / 30000 = 409 which is the DAG info shared above. **Moving forward we need to update DAG information for every new EPOCH**
* CLI Relayer : Relays the blocks, this is initially written in javascript as a Proof of concept and may be implemented in other languages moving forward. **Once the Relayer has begun we need to continually relay each block**
* Client: The client is used to Process transactions this is done by locking the Token using the TokenLocker.sol contract (e.g. TokenLockerOnEth.Sol AND TokenLockerOnHarmony.sol)
Currently only ERC20 are supported. Moving forward ERC721 and ERC1155 as well as operations on smart contracts will also be supported. For now all client transactions will be done using the CLI. Moving forward  the current bridge (bridge.harmony.one) will be migrated to https://bridge-validator-1.web.app/ and jenya also built a fresh frontend for upcoming trustless bridge: https://github.com/harmony-one/horizon-trustless-frontend
but most likely, we will stick to the first one.
* Harmony Node: we use a [harmony local node](https://github.com/harmony-one/harmony#dev-docker-image) this can be run via docker. **There is a pull request which needs to be pushed to Harmony Testnet to enable the bridging functionality. [we need this PR to be pushed to testnet (should be done by May 27th, 2022)](https://github.com/harmony-one/harmony/pull/3872)**
* For fully trustless bridge we need the bls signature verification precompile to be available on ethereum [eip-2537](https://eips.ethereum.org/EIPS/eip-2537), however this won't be a blocker, as we can initially do permissioned relayers, later adopt optimistic approach, etc. there are many fallback plans for this.

**Current Status**
* End to End Testing : Has never been succesfully completed
* Smart Contract Tests: Have errors in them.

**Testing Summary**

| #   | Status | Step                          | Notes |
| --- | ------ | ----------------------------- | ----- |
| 1   | *PASS  | Infrastructure Setup          | Working with Local Net until [PR 3872](https://github.com/harmony-one/harmony/pull/3872) is pushed to Testnet |
| 2   | TBD    | Ropsten Smart Contract Deploy | | 
| 3   | TBD    | Harmony Smart Contract Deploy | |
| 4   | TBD    | Relayer Running               | |
| 5   | TBD    | End To End Testing            | |

**Migration Strategy**
* Smart Contract use Hardhat with Typescript and ethers(instead of web3)
  * Replace all web3 with ethers
  * replace all js files with typescript
  * remove all truffleConfig use hardhat instead
  * write tests
* docs: new folder for documentation
* docs/assets => migrated from assets
* docs/solidity: contains generated solidity documentation
* deploy: new folder for deployment scripts (using hardhat-deploy and logic from scripts)
* src: new folder for typescript source files 
* src/lib: (migrated from scripts)
* src/cli: (migrated from cli)
* src/(elc, eprover, eth2hmy-relay): migrated from tools(elc, eprover, eth2hmy-relay)

**RollOut Strategy**
* Complete End To End Testing (using CLI)
* Write Smart Contract Tests (will use hardhat)
* Update Smart Contract Documentation and README.md
* Integrate with Front END UI
* Onboard Production Validators (15 Validators to relay blocks - incentives tbd)


**Additional Notes/Action Items**
- [ ] PR from Ganesha for Harmony Testnet Bridge Support
- [ ] Check Status of TokenLocker and ERC721 and ERC1155 support (Bruce)
- [ ] Review item which is needed for Permissionless Rollout of Validators (waiting on something on Ethereum?)
- [ ] Check test updates from Boris

## Environment Data

Here is an overview of Environment data setup for testing after following the steps below

* Deployer Address : 0x8875fc2A47E35ACD1784bB5f58f563dFE86A8451
* Infura Project: 32cb9c57bfe447a99ea34e30195b2d10
* KOVAN ERC20 Contract: [0xc90a6555CaD53a9D85a80052Fe2926E21608CF41](https://kovan.etherscan.io/address/0xc90a6555cad53a9d85a80052fe2926e21608cf41)
* ROPSTEN ERC20 Faucet Contract



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

### Infura Project Setup

We use an an infura account to integrate with a Ropsten Node.

Create an [Infura Account](https://infura.io/) and create an ethereum project. Add the INFURA_PROJECT_ID to the `.env` file.

### Running a local Harmony Network
See [here](https://github.com/harmony-one/harmony#debugging) for build instructions

```
cd $(go env GOPATH)/src/github.com/harmony-one/harmony
make debug
```
To stop the network use `^C` or `make debug-kill`

*Note: If using a later version of openssl (e.g. openssl v3.3) on a mac you may need to modify `scripts\go_executable_build.sh` changing this line `LIB[libcrypto.3.dylib]=/usr/local/opt/openssl/lib/libcrypto.3.dylib`*

### Deployer Account
Create a deployer account and fund it in both Harmony Testnet and Ropsten using Faucets. Add the PRIVATE_KEY to the `.env` file

[Here](https://ropsten.oregonctf.org/) is a ropsten faucet.

To fund your harmony account use the [harmony cli](https://docs.harmony.one/home/general/wallets/harmony-cli) or metamask and transfer funds from the following account.


```
On localnet, by default, 0xA5241513DA9F4463F1d4874b548dFBAC29D91f34 has funds, as defined in core/genesis.go. The private key for this address is 1f84c95ac16e6a50f08d44c7bde7aff8742212fda6e4321fde48bf83bef266dc
```

For testing purposes we used account `0x8875fc2A47E35ACD1784bB5f58f563dFE86A8451` and funded it with 1000 ONE on localnet and 1 ETH on Ropsten, but you can use any acccount you like as long as you know the private key or mnemonic.

## Creating the DAG Merkle Tree

DAG genertion takes several hours to run Ganesha has a machine to do this and shares the latest DAG info from Ropsten using [google drive](https://drive.google.com/file/d/1FqLCO5oc1xDYNMuub7xAqnb6kfohdf-U/view?usp=sharing). The epoch logic is the block Number divided by 30,000 so current Ropsten EPOCH is block 12280236 / 30000 = 409 which is the DAG info shared above.

To run this command from the CLI you would
```
cd cli
node index.js dagProve generate 409
```
which calculate merkle root for epochs from [start, start+n)

**Note: You do not need to generate the DAG for the Harmony Chain, just Ethereum (Ropsten)**

If to find the latest epoch on Harmony you can look at [explorer](https://staking.harmony.one/validators/testnet/one1fxazl9qk7c30mk3lp7tun4yepptwvfq9ss28u7) for a validater and see the latest epoch on the EXPECTED RETURN HISTORY GRAPH. For example in Harmony Testnet on May 18th 2022, the latest epoch was 75762 so to generate the merkle root would need to run the following `node index.js dagProve generate 75762`.

 *Note: Moving forward we need to update DAG information for every new EPOCH on Ethereum(Ropsten)*

 **Original Documentation**
Original documenation is found [here](https://github.com/johnwhitton/horizon/tree/main/cli#dag-merkel-tree-cli) and uses the cli
#### DAG Merkel Tree CLI
1. `node index.js dagProve generate` which calculate merkle root for epochs from [start, start+n)
```
node index.js dagProve generate 377
```
2. `node index.js dagProve blockProof` which accepts block number to calculate all necessary information in order to prove the block
```
node index.js dagProve blockProof --block 11266784 --url https://ropsten.infura.io/v3/<project-id>
```

**Questions**
1. When do you need to run `node index.js dagProve blockProof`?
2. Do you need to generate a new DAG information on each EPOC change?
3. Where is this currently hosted?
4. Where do we want to deploy this longterm?

## Deploying Smart Contracts

Following is an overview of the contracts used in the bridge and which chain they should be deployed on. *Note: her we only focus on the contracts deployed the imported contracts are not covered*

**Ethereum (Kovan)**
* HarmonyLightClient.sol : stores all blockheaders which are used for verification.
* TokenLockerOnEthereum.sol : Tracks tokens locked which are then minted by the bridge
* FaucetToken.sol : Token created on Ethereum which will be bridged to Harmony (Testing Only)

**Harmony (Localnet)**
* EthereumLightClient.sol : stores all blockheaders used for verification
* TokenLockerOnHarmony.sol : Tracks tokens locked which are then minted by the bridge 
* FaucetToken.sol : Token created on Harmony which will be bridged to Ethereum (Testing Only)

**Original Documentation**
Original documentation using the CLI can be found [here for Ethereum Light Client](https://github.com/johnwhitton/horizon/blob/main/cli/README.md#elcethereum-ligth-client-cli) and [here for Bridge CLI](https://github.com/johnwhitton/horizon/blob/main/cli/README.md#bridge-cli) but the CLI does not mention Ethereum deployment or the deployment of the TokenLocker contracts.

The tools folder also has notes on Ethereum Light client deployment using truffle [here](https://github.com/johnwhitton/horizon/tree/main/tools/elc#deployment).

There are also two scripts available [deploy_eth_side.js](https://github.com/johnwhitton/horizon/blob/main/scripts/deploy_eth_side.js) and [deploy_hmy_side.js](https://github.com/johnwhitton/horizon/blob/main/scripts/deploy_hmy_side.js)

**Questions**
1. Are there additional contracts besides LightClient, TokenLocker and FaucetToken which need to be deployed?
2. Which of the methods above were used to deploy the contracts previously?
3. What is the purpose of `-block=<ETH BLOCK NUMBER>` do we need to provide blockNumber?
4. Do we need to run post deploy steps such as [configure.js](https://github.com/johnwhitton/horizon/blob/main/scripts/configure.js)?
5. Is there any [upgrade process](https://github.com/johnwhitton/horizon/tree/main/scripts/upgrade) and if so when is it needed?
6. What is the purpose of `node index.js Bridge deployFakeClient`
7. What is the purpose of `node index.js Bridge change`

## Deploying the Relayer


## End to End Testing

# Running Tests
Tests are set up in the tests folder and are run using hardhat.

`yarn test` is set up as a script to run `npx hardhat test`




### Use the Horizon CLI to setup and run the bridge

#### Horizon CLI
CLI is a utility that provides a command-line interface to all the components to the Horizon bridge and allow performing end-to-end bridge functionalities.

#### CLI Help Infomation
`node index.js [command] -h`

#### DAG Merkel Tree CLI
Ropsten Divide Ropsten BlockNumber by 30,000
e.g. https://ropsten.etherscan.io/block/12280236 divided by 30,000

Ganesha will share the file.

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


```
johnlaptop cli (main) $ node index.js --help
Usage: index [options] [command]

Horizon Trustless Bridge CLI

Options:
  -h, --help      display help for command

Commands:
  dagProve        DAG Merkel Tree cli
  ELC             ethereum ligth client cli
  ethRelay        ethereum block relay cli
  EProver         ethereum receipt prove cli
  EVerifier       ethereum receipt verify cli
  Bridge          bridge cli
  help [command]  display help for command
  ```

# Component Overview
Following is an overview of the components which make up the horizon bridge.

| #       | Component                   | Function                   | Status   | Notes  |
| ------- | --------------------------- | -------------------------- |--------- |------- |
| **1**   | **contracts**               | **On chain Functionality** | Untested |        |
| 1.1     | HarmonyLightClient.sol      | 
| 1.2     | TokenLockerOnEtherum.sol    |
| 1.3     | FaucetToken.sol             |
| 1.4     | EthereumLightClient.sol     |
| 1.5     | TokenLockerOnHarmony.sol    |
| **2**   | tools                       |
| 2.1     | elc                         |
| 2.2     | eprover                     |
| 2.3     | eth2my-relay                |
| **3**   | **cli**                     |
| 3.1     | elc                         |
| 3.2     | ethashProof                 |
| 3.3     | eth2hmy-relay               |
| 3.4     | bridge                      |
| 3.5     | everifier                   |
| **4**   | **scripts**                 |
| 4.0     | utils.js                    |
| 4.1     | deploy_eth_side.js          |
| 4.2     | deploy_hmy_side.js          |
| 4.3     | deploy_erc20.js             |
| 4.4     | upgrade                     |
| 4.5     | configure.js                |
| 4.6     | test.js                     |
| 4.7     | newtest.js                  |
| 4.8     | end2end.js                  |
| **5**   | **test**                    |
| 5.1     | bridge.hmy.js               |


**Migration Strategy**
* Smart Contract use Hardhat with Typescript and ethers(instead of web3)
  * Replace all web3 with ethers
  * replace all js files with typescript
  * remove all truffleConfig use hardhat instead
  * write tests
* docs: new folder for documentation
* docs/assets => migrated from assets
* docs/solidity: contains generated solidity documentation
* deploy: new folder for deployment scripts (using hardhat-deploy and logic from scripts)
* src: new folder for typescript source files 
* src/lib: (migrated from scripts)
* src/cli: (migrated from cli)
* src/(elc, eprover, eth2hmy-relay): migrated from tools(elc, eprover, eth2hmy-relay)