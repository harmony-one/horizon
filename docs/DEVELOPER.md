# Developer and Testing guide
This guide is for developers and testers working on the Horizon Bridge. It's focus is on the backend infrastructure including configuring nodes, deploying smart contracts generation of DAG's and using the CLI. We work with local nodes initially and add additional information for other envrionments.

To gain a better understanding of what some of the yarn commands are doing it is recommended that developers review the scripts in `package.json`.

## Quick Start Cheat Sheet

```
# clone the horizon repository
git clone https://github.com/harmony-one/horizon.git

# install the node modules
yarn init-all

# In separate termintal windows start hardhat and harmony localnet
# Note: Prerequisite is that you have a local Harmony Node set up see below
yarn eth-local
yarn harmony-local

# Smart-Contract (Solidity) Commands

# Clean all solidity artifacts
yarn clean

# Compile the Contracts
yarn compile

# Run the tests
yarn test

# Run coverage report
yarn coverage

# Deploy the contracts on Harmony(localnet) and Ethereum(hardhat)
yarn deploy-localnet
yarn deploy-hardhat

```

## Setting up the codebase

**Clone this repository**
`git clone https://github.com/harmony-one/horizon.git`

**Initialize node_modules, clean solidity environment and compile contracts**
`yarn init-all`
You can check `package.json` to review what this command does, it

## Setting up the Infrastructure 

### Network Overview

| Environment | Network  | Description                 | Notes                          |
| ----------- | -------- | --------------------------  | ------------------------------ |
| Local       | localnet | Harmony local network       | local build                    |
| Local       | hardhat  | Ethereum local network      | local build                    |
| Testnet     | testnet  | Harmony test network        | hosted by Harmony              |
| Testnet     | ropsten  | Ethereum test network       | hosted using infura or alchemy |
| Production  | mainnet  | Harmony production network  | hosted by harmony              |
| Production  | ethereum | Ethereum production network | hosted using infura or alchemy |

*Note: network configuration can be found in hardhat.config.ts and we have a harmony specific focus (e.g. localnet, testnet and mainnet refer to Harmony networks) and Ethereum networks are defined by name (e.g. hardhat, ropsten and ethereum)*

### Running Local Nodes

**Ethereum Node**
We use hardhat to run a local ethereum node. However as deploy scripts are specific to chains. We do not wish to run the deploys when we start a node. 

To start a local hardhat(ethereum) node use
`yarn eth local`
which runs
`npx hardhat node --no-deploy`

**Harmony node**
At the time of writing we need to build the node locally. This should be done from [ganesha's mmr-hard-fork branch](https://github.com/gupadhyaya/harmony/tree/mmr-hard-fork). 

See [here](https://github.com/harmony-one/harmony#debugging) for build instructions

```
cd $(go env GOPATH)/src/github.com/harmony-one/harmony
make debug
```
To stop the network use `^C` or `make debug-kill`

*Note: If using a later version of openssl (e.g. openssl v3.3) on a mac you may need to modify `scripts\go_executable_build.sh` changing this line `LIB[libcrypto.3.dylib]=/usr/local/opt/openssl/lib/libcrypto.3.dylib`*

To run a local harmony network use
`yarn harmony-local`

To stop the local harmony network use
`^C` or `make debug-kill` or `yarn harmony-local-kill`


### Running Testnet Nodes

**Ethereum (Ropsten) Node**
We use an an infura account to integrate with a Ropsten Node.

Create an [Infura Account](https://infura.io/) and create an ethereum project. Add the INFURA_PROJECT_ID to the `.env` file.

**Harmony node**
There is a pull request which needs to be pushed to Harmony Testnet to enable the bridging functionality. [we need this PR to be pushed to testnet (should be done by May 27th, 2022)](https://github.com/harmony-one/harmony/pull/3872).

### Funding the Deployer Account

**Local Deployer Accounts**
Harmony localnet has a default account of `0xA5241513DA9F4463F1d4874b548dFBAC29D91f34` which has funds, as defined in core/genesis.go. The private key for this address is `1f84c95ac16e6a50f08d44c7bde7aff8742212fda6e4321fde48bf83bef266dc`

For testing purposes we used account `0x8875fc2A47E35ACD1784bB5f58f563dFE86A8451` and funded it with 1000 ONE on localnet and 1 ETH on Ropsten, but you can use any acccount you like as long as you know the private key or mnemonic.

**Testnet Funding of Accounts**
Create a deployer account and fund it in both Harmony Testnet and Ropsten using Faucets. Add the PRIVATE_KEY to the `.env` file

[Here](https://ropsten.oregonctf.org/) is a ropsten faucet.

To fund your harmony account use the [harmony cli](https://docs.harmony.one/home/general/wallets/harmony-cli) or metamask and transfer funds from the following account.

## Smart Contracts

Following is an overview of the contracts used in the bridge and which chain they should be deployed on. *Note: here we only focus on the contracts deployed the imported contracts are not covered*

| Network  | Contract                  | Functionality                                           | Notes        |
| -------- | ------------------------- | ------------------------------------------------------- | ------------ |
| Harmony  | EthereumLightClient.sol   | Tracks block headers from ethereum                      |              |
| Harmony  | TokenLockerOnEthereum.sol | Locks tokens which are being transferred between chains |              |
| Harmony  | FaucetToken.sol           | ERC20 token used for testing                            | Testing Only |
| Ethereum | HarmonyLightClient.sol    | Tracks block headers from harmony                       |              |
| Ethereum | TokenLockerOnHarmony.sol  | Locks tokens which are being transferred between chains |              |
| Ethereum | FaucetToken.sol           | ERC20 token used for testing                            | Testing Only |

We use [hardhat](https://hardhat.org/getting-started) for contract development and testing and have updated `pacakge.json` scripts to make compiling, testing and deployment of contracts easier. Below we will list the commands used however as a developer you should be familiar with the tools used and be able to add addtional scripts to `package.json` as needed.

### Compiling Smart Contracts
`yarn compile`

### Testing Smart Contracts

**Testing Strategy**
* Unit Testing: Each Contract has it's own unit test covering positive use cases, negative use cases, event validation and complex scenarios
* Scenario Testing: Additional Tests will be for Scenarios grouped as follows
  * Relayer Testing: Validation that block headers are relayed between to the two chains
  * Token Testing: Validation that tokens can be transferred between chains
* Coverage: We will use hardhat coverage to generate coverage reports

**Sample Test**
* Tests are run using `yarn test`
* Specific Test Files can be run with `npx hardhat test ./test/EthereumLightClient.ts`
* Specific Tests can be run with `npx hardhat test ./test/EthereLightClient.ts --grep 'EthereumLightClient-1 `'

```
johnlaptop horizon (refactor) $ yarn test
yarn run v1.22.18
warning ../../package.json: No license field
$ npx hardhat test
No need to generate any newer typings.
✅ Generated documentation for 46 contracts


  HarmonyProver
    1) "before each" hook for "parse rlp block header"

  TokenLocker
    2) "before each" hook for "issue map token test"

  EthereumLightClient
    EthereumLightClient Tests
      ✔ EthereumLightClient-1 view functions should work (44ms)
      ✔ EthereumLightClient-2 update functions should work
      ✔ EthereumLightClient-3 reverts should work for negative use cases
      ✔ EthereumLightClient-4 complex tests should work

  FaucetToken
    FaucetToken Tests
      ✔ FaucetToken-1 view functions should work (42ms)
      ✔ FaucetToken-2 update functions should work
      ✔ FaucetToken-3 reverts should work for negative use cases
      ✔ FaucetToken-4 complex tests should work

  HarmonyLightClient
    HarmonyLightClient Tests
      ✔ HarmonyLightClient-1 view functions should work
      ✔ HarmonyLightClient-2 update functions should work
      ✔ HarmonyLightClient-3 reverts should work for negative use cases
      ✔ HarmonyLightClient-4 complex tests should work

  TokenLockerOnEthereum
    TokenLockerOnEthereum Tests
      ✔ TokenLockerOnEthereum-1 view functions should work
      ✔ TokenLockerOnEthereum-2 update functions should work
      ✔ TokenLockerOnEthereum-3 reverts should work for negative use cases
      ✔ TokenLockerOnEthereum-4 complex tests should work

  TokenLockerOnHarmony
    TokenLockerOnHarmony Tests
      ✔ TokenLockerOnHarmony-1 view functions should work
      ✔ TokenLockerOnHarmony-2 update functions should work
      ✔ TokenLockerOnHarmony-3 reverts should work for negative use cases
      ✔ TokenLockerOnHarmony-4 complex tests should work


  20 passing (3m)
  2 failing

  1) HarmonyProver
       "before each" hook for "parse rlp block header":
     NomicLabsHardhatPluginError: You tried to link the contract HarmonyProver with MMRVerifier, which is not one of its libraries.
This contract doesn't need linking any libraries.
      at collectLibrariesAndLink (node_modules/@nomiclabs/hardhat-ethers/src/internal/helpers.ts:207:13)
      at getContractFactoryFromArtifact (node_modules/@nomiclabs/hardhat-ethers/src/internal/helpers.ts:149:32)
      at getContractFactory (node_modules/@nomiclabs/hardhat-ethers/src/internal/helpers.ts:93:12)
      at async Context.<anonymous> (test/bridge.hmy.ts:29:21)

  2) TokenLocker
       "before each" hook for "issue map token test":
     TypeError: tokenLocker.bind is not a function
      at Context.<anonymous> (test/bridge.hmy.ts:75:23)



error Command failed with exit code 2.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
```

**Sample Coverage Report**
* coverage reports are run using `yarn coverage`
* coverage for a specific test file can be generated with `yarn coverage --testfiles ./test/EthereumLightClient.ts`

```
----------------------------|----------|----------|----------|----------|----------------|
File                        |  % Stmts | % Branch |  % Funcs |  % Lines |Uncovered Lines |
----------------------------|----------|----------|----------|----------|----------------|
 contracts/                 |     7.31 |     8.75 |     9.09 |     4.82 |                |
  BridgedToken.sol          |        0 |      100 |        0 |        0 |       20,21,27 |
  EthereumLightClient.sol   |     5.56 |        0 |    13.33 |     5.48 |... 323,325,327 |
  EthereumParser.sol        |    25.35 |       25 |       50 |       25 |... 129,139,141 |
  EthereumProver.sol        |        0 |        0 |        0 |        0 |... 287,289,292 |
  FaucetToken.sol           |       25 |      100 |       50 |       25 |       19,20,21 |
  HarmonyLightClient.sol    |     1.32 |        0 |     7.14 |     1.27 |... 226,229,233 |
  HarmonyParser.sol         |    11.22 |    15.96 |     7.14 |    10.08 |... 381,383,392 |
  HarmonyProver.sol         |        0 |        0 |        0 |        0 |... 188,196,204 |
  Migrations.sol            |        0 |        0 |        0 |        0 |       10,14,18 |
  TokenLocker.sol           |        0 |        0 |        0 |        0 |... 146,147,148 |
  TokenLockerOnEthereum.sol |     6.67 |        0 |       25 |     6.67 |... 50,51,52,53 |
  TokenLockerOnHarmony.sol  |     8.33 |        0 |       25 |     8.33 |... 55,60,61,62 |
  TokenRegistry.sol         |        0 |        0 |        0 |        0 |... 100,101,102 |
 contracts/ethash/          |        0 |        0 |        0 |        0 |                |
  MerkelRoot.sol            |        0 |        0 |        0 |        0 |    12,13,14,15 |
  Prime.sol                 |        0 |        0 |        0 |        0 |... 85,88,89,91 |
  binary.sol                |        0 |      100 |        0 |        0 |... 46,55,56,64 |
  ethash.sol                |        0 |      100 |        0 |        0 |... 503,504,505 |
  keccak512.sol             |        0 |        0 |        0 |        0 |... 285,286,288 |
 contracts/lib/             |     8.99 |     8.48 |     11.7 |     9.25 |                |
  ECVerify.sol              |        0 |        0 |        0 |        0 |... 22,24,27,29 |
  EthUtils.sol              |        0 |        0 |        0 |        0 |... 81,82,84,87 |
  MMR.sol                   |        0 |        0 |        0 |        0 |... 532,533,535 |
  MMRVerifier.sol           |        0 |        0 |        0 |        0 |... 209,210,212 |
  MMRWrapper.sol            |        0 |      100 |        0 |        0 |... 52,57,58,60 |
  MPT.sol                   |        0 |        0 |        0 |        0 |... 282,283,285 |
  MPTValidatorV2.sol        |        0 |        0 |        0 |        0 |... 39,40,42,43 |
  RLPEncode.sol             |        0 |        0 |        0 |        0 |... 251,253,295 |
  RLPReader.sol             |    46.36 |     41.3 |       50 |    47.75 |... 374,376,377 |
  SafeCast.sol              |        0 |        0 |        0 |        0 |... 17,18,22,23 |
 contracts/mocks/           |        0 |      100 |        0 |        0 |                |
  LightClient.sol           |        0 |      100 |        0 |        0 |    21,30,31,32 |
  MPTTest.sol               |        0 |      100 |        0 |        0 |             13 |
 contracts/test_contracts/  |        0 |        0 |        0 |        0 |                |
  TestEthLightClient.sol    |        0 |        0 |        0 |        0 |... 35,36,43,46 |
----------------------------|----------|----------|----------|----------|----------------|
All files                   |     6.76 |     8.22 |      9.3 |     5.81 |                |
----------------------------|----------|----------|----------|----------|----------------|
```

### Deploying Smart Contracts
Deploying of smart contracts are specific to their network to control this we use the `deployFunction.tags` field in the deployment file and run the deployments using a combination of the `--network` and `--tags` options e.g. `hardhat deploy --network hardhat --tags hardhat`

The tags we utilize are as follows
* `ContractName`: e.g. `HarmonyLightClient` the contract we are deploying used to deploy individual contracts
* `Ethereum`: for all contracts to be deployed on Ethereum
* `Harmony`: for all contracts to be deployed on Harmony
* `Production`: for all contracts which are to be deployed to mainnet (e.g. FaucetTokens are not to be deployed to production)

We also update `package.json` to provide simplified deploy commands, by specifying the network and the tag. For example
* `"deploy-hardhat": "hardhat deploy --network hardhat --tags Ethereum",`: deploys all Ethereum contracts on the hardhat (local Ethereum) network
* `    "deploy-localnet-lightClient": "hardhat deploy --network localnet --tags EthereumLightClient",`: deploys the specific contract EthereumLightClient on localnet (local Harmony) network.



Local Deployments
```
yarn deploy-localnet
yarn deploy-hardhat
```

### Upgrading Smart Contracts

**Proxies and Upgradability**
In the original codebase deployments of contracts where made upgradeable via the use of [upgrade scripts](https://github.com/harmony-one/horizon/tree/main/scripts/upgrade) and `await upgrades.deployProxy` (e.g. see [deploy_erc20.js](https://github.com/harmony-one/horizon/blob/main/scripts/deploy_erc20.js)).

Currently requirements around upgradeability are under review. 

Alernate ways to achieve this are
1. Hardhat Upgrades: Open Zepplin provides an [upgrade plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades) via [this npm package](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades).  
2. [EIP-2535 Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535): Diamonds are [supported by hardhat-deploy](https://github.com/wighawag/hardhat-deploy/tree/master#builtin-in-support-for-diamonds-eip2535) and have [reference-implementations](https://github.com/mudgen/diamond-3-hardhat).

Recommendation: Diamonds appear to be the more robust solution and will enable upgrading of functionality long term as we evolve our relay and verification functionality. If time is a constraint can use Hardhat Upgrades initially and then migrate to Diamonds at a later point. However this will incur a migration cost.

## CLI
A CLI has been developed to facilitate testing. Complete with mutliple commands and help functionality. We will provide an overview of the functionality it provides and also how to use it for end to end testing.

A good way to familiarize yourself with the cli is to run `node src/cli/index.js --help`

### CLI Functionality

Below is an overview of the high level commands for details we recommend running `node src/cli/index.js <command> --help` e.g. `node src/cli/index.js dagProve --help` for a better understanding of the options it is recommended to review the code in `src/cli/index.js`.

**High Level Commands**
```
johnlaptop horizon (refactor) $ node src/cli/index.js --help
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

**Sample Command Help**
```
johnlaptop horizon (refactor) $ node src/cli/index.js dagProve --help
Usage: index dagProve [options] [command]

DAG Merkel Tree cli

Options:
  -h, --help                        display help for command

Commands:
  generate [options] <epoch_start>  generate cache merkle tree for epochs [start, start+num)
  blockProof [options]              get block proof data
  help [command]                    display help for command
```

## Example End to End Testing Locally

Here we will walk through end to end testing using the CLI. at the bottom there will be a list of recommendations enhancements.

*Note: `ethWeb3.js` curretnly uses one privateKey for all environments `prikey = process.env.PRIKEY` it is recommended to use the Harmony Localnet private key above and transfer funds to it (e.g. using metamask) from the hardhat account 0 (the deployer account) before deployments.*

### Testing Steps Overview

| #   | Step | Notes |
| --- | ---- | ----- |
| 0   | Prerequisite: Start local nodes     | See [above](#running-local-nodes)for running hardhart and harmony localnet |
| 1   | Deploying Smart Contracts           | Deploy scripts are above, below we will use CLI Functionality |
| 2   | Generate DAG Merkle Tree            | A DAG Merkle tree needs to be generated from the Ethereum Chain |
| 3   | Relay Blocks Between the Two Chains | Blocks need to be relayed proven and verified |
| 4   | Bridge Tokens                       | Deploy tokens to be bridged and transfer tokens back and forth between two chains |

### 0: Start Local Nodes

See [Running Local Nodes](#running-local-nodes)

### 1: Deploying Smart Contracts
See [Smart Contracts](#smart-contracts) for information on deploying the required smart contracts using hardhat.

Below gives an overview of how to deploy these contracts for the CLI.

| Network  | Contract                  | Example LocalNet Command  | Notes        |
| -------- | ------------------------- | ------------------------------------------------------- | ------------ |
| Harmony  | EthereumLightClient.sol   | `ELC deploy -b 0 -u "http://localhost:8545" "http://localhost:9500"`| Can also pass an rlp Header |
| Harmony  | TokenLockerOnEthereum.sol | `yarn cli Bridge deploy http://localhost:8545 http://localhost:9500`  |  One command deploys both lockers on Ethereum and Harmony   |
| Harmony  | EthereumProver.sol        | `yarn cli EVerifier deploy "http://localhost:8545"` | |
| Harmony  | FaucetToken.sol           | `yarn cli Bridge deployFaucet "http://localhost:9500" -m 10000` | Testing Only |
| Harmony  | EthereumLightClient.sol   | `yarn cli Bridge deployFakeClient "http://localhost:9500"` | TESTING ONLY **Need to clarify whether this is needed** |
| Ethereum | HarmonyLightClient.sol    |                       |              | **Do we deploy this?**
| Ethereum | TokenLockerOnHarmony.sol  |  `yarn cli Bridge deploy http://localhost:8545 http://localhost:9500`  | One command deploys both lockers on Ethereum and Harmony  |
| Ethereum | FaucetToken.sol           | `yarn cli Bridge deployFaucet "http://localhost:8545" -m 10000`                           | Testing Only |
| Ethereum  | EthereumLightClient.sol   | `yarn cli Bridge deployFakeClient "http://localhost:8545"` | TESTING ONLY **Need to clarify whether this is needed** |


### 2: Generate DAG Merkle Tree

### 3: Relay Bocks Between the Two Chains

### 4: Bridge Tokens


* Deploying Bridged Tokens: `node src/cli/index.js  Bridge deploy http://localhost:8545 http://localhost:9500`

### Notes and recommendations
- [ ] remove `src/cli/lib/` replace ethWeb3 and hmyWeb3 with hardhat deploy scripts and tools
- [ ] .env define seperate accounts for each network and update hardhat.config.ts
- [ ] make consistent use of `ethers.js` replacing libraries such as `web3`, `rlp`, `bigNumber`, `ethereumjs-util`. Recommendation is `ethers` vs `web3` based on hardhat integration [this article](https://moralis.io/web3-js-vs-ethers-js-guide-to-eth-javascript-libraries/), [these stats](https://npm-stat.com/charts.html?package=ethers&package=web3&from=2021-01-01&to=2021-06-01) and these comments `Ethers.js loads slightly faster thanks to its noticeably smaller size, which may offer better performance.` and `However, the blockchain industry as a whole is slowly migrating towards a younger alternative – Ethers.js. `
- [ ] Upgrade CLI commands into functional stages (e.g. infrastructure, deployment, relayer (incorporates ethRelayer, EProver, ) and bridging)
- [ ] Consolidate abi's currently under different folders (e.g. `cli/bridge/abi`, `cli/elc/abi`, `cli/eprover/abi`) can use the automatically generated abis under `build/Contracts` e.g. `build/Contracts/TokenLockerOnEthereum.sol/TokenLockerOnEthereum.json` if this is not preferred can update deploy scripts to automatically update current disparate directories on build.
- [ ] If continuing to use the CLI improve validation rather than throwing exceptions (e.g. when calling `yarn cli ELC deploy -b 0 -u "http://localhost:8545" "http://localhost:9500")` we get exceptions when the Ethereum url is not populated


### Additional Feedback (Action Items)
From @polymorpher on [PR Refactor #38](https://github.com/harmony-one/horizon/pull/38)
- [ ] Harmony Epoch: Each epoch should have 32768 blocks https://docs.harmony.one/home/network/validators/definitions/epoch-transition
- [ ] What are the DAGs for and how is it generated?
- [ ] Might be worthwhile discussing the differences in frequency and behaviors of how block headers are relayed between Ethereum and Harmony.
- [ ] Is this referring to Ethereum and Harmony light clients? I think they are for adding and verifying block headers from the other side. Token lockers are for managing tokens and verifying transactions and releasing the tokens after a bridge transaction is verified.
- [ ] It seems the frontend implementation contains only a basic user interface, and does not have the majority of the necessary frontend components (APIs, services, state and session management, error handling, UI usage of APIs, and many others). I think the documentation we put here should reflect some of the details and the state of the frontend, otherwise it may give developers, users, and partners an inaccurate impression of the state of completion
- [ ] What are the paths to support ERC721 and ERC1155? It would be nice to have some clarifications or pointers to technical components required and TODO lists
- [ ] Why is this PR needed? Is it not sufficient to have the block header submitters (relays) to compute the MMR?
- [ ] Can this be clarified in more detail? Where is BLS signature verification needed, and why isn't there any alternative? What are the optimistic approach and fallback options?
- [ ] It would be very helpful to have more unit tests, and comments explaining what each component (and unit test) is doing. Right now it is not apparent that each unit component is functioning as intended, what the corner cases are, what the potential attack vectors are, and how they are defended (through the bridging mechanism). It would be nice to have the unit tests illustrating those
- [ ] it seems some substantial frontend implementation work needs to be done before integration could take place
- [ ] Non-validators can also relay blocks as long as they have access to a valid RPC node. Have we decided on the criteria of inclusion for the initial permissioned set of relayers? Many of them would be submitting redundant block headers and epochs - what are the top 3 things we want to achieve through this initial set of relayers, and what is the roadmap for transitioning into a permissionless set?
- [ ] The code looks like something that can be parallelized and made efficient. What exactly is DAG and what is the purpose of generating all of them? Why is it aligned to epoch numbers? I think these questions should be answered before discussing how DAG is generated and the relevant commands
- [ ] Harmony block headers - I think it would be informative to document the differences compared to Ethereum block headers, and how the light clients act differently (frequency and nature of updates, cost considerations, etc.)
- [ ] `bridge cli` This seems to trigger an actual "bridging" but I am not sure if it is supposed to work. It covers some deployment and verification stuff, but doesn't seem to cover end-to-end
- [ ] Can all links point to files in the original repository and made permalink (so they don't change across versions?)
- [ ] As to the questions, I suppose Bridge subcommands (the three you mentioned) can be used to do human-driven testing once deployment is complete. But they don't seem to be good for any automated testing. I don't think there is any end-to-end testing elsewhere
- [ ] Some PRs seem to be introducing useful tests, for example: https://github.com/harmony-one/horizon/pull/31/files




### DAG Merkle Tree

It is required to generate the DAG(directed acyclic graph) Merkle Tree for the Ethereum node we are connecting to.

**Localnet (Hardhat) DAG Generation**

```
cd ./src/cli
node index.js --help
node index.js dagProve generate
node index.js dagProve blockProof

```

### DAG Merkel Tree CLI
1. `node index.js dagProve generate` which calculate merkle root for epochs from [start, start+n)
```
node index.js dagProve generate 377
```
2. `node index.js dagProve blockProof` which accepts block number to calculate all necessary information in order to prove the block
```
node index.js dagProve blockProof --block 11266784 --url https://ropsten.infura.io/v3/<project-id>
```

**Testnet (Ropsten) DAG Generation**

DAG genertion takes several hours to run Ganesha has a machine to do this and shares the latest DAG info from Ropsten using [google drive](https://drive.google.com/file/d/1FqLCO5oc1xDYNMuub7xAqnb6kfohdf-U/view?usp=sharing). The epoch logic is the block Number divided by 30,000 so current Ropsten EPOCH is block 12280236 / 30000 = 409 which is the DAG info shared above.

After downloading the file and unzipping it move the epoch into the dag directory using 

`cp -rf  ~/Downloads/409 ./src/cli/dag/.`

 *Note: Moving forward we need to update DAG information for every new EPOCH on Ethereum(Ropsten)*

**Note: You do not need to generate the DAG for the Harmony Chain, just Ethereum (Ropsten)**

**How to find the Harmony Epoch (informational only, no need to generate a DAG for Harmony)**
If to find the latest epoch on Harmony you can look at [explorer](https://staking.harmony.one/validators/testnet/one1fxazl9qk7c30mk3lp7tun4yepptwvfq9ss28u7) for a validater and see the latest epoch on the EXPECTED RETURN HISTORY GRAPH. For example in Harmony Testnet on May 18th 2022, the latest epoch was 75762.
## Running a Relayer


## Running a client (CLI)

## Running a client (Web Front End)


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
| 1.6     | FaucetToken.sol             |
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


### Additional References
* [Additional Bridge Research](https://eavenetwork.notion.site/Bridges-713be29794df41b4aeb65c26d6a0404b): Other Bridging techniques including Nomad, Cosmos, Solana Wormhole, Snowfork and XCMP.
* [Nomad's Docs](https://docs.nomad.xyz/#home):  Nomad's optimistic rollup hub and spoke appoach
* [EIP-235: Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535): Smart contract compasability 


