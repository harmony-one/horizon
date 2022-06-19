# Developer and Testing guide
This guide is for developers and testers working on the Horizon Bridge. It's focus is on the backend infrastructure including configuring nodes, deploying smart contracts generation of DAG's and using the CLI. We work with local nodes initially and add additional information for other envrionments.

To gain a better understanding of what some of the yarn commands are doing it is recommended that developers review the scripts in `package.json`.

## Quick Start Cheat Sheet

```
# clone the horizon repository
git clone https://github.com/harmony-one/horizon.git

# install the node modules
yarn init-yarn

# In separate termintal windows start localgeth and harmony localnet
# Note: Prerequisite is that you have a local Harmony Node set up see below
yarn init-chain
yarn geth-local
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

# Deploy the contracts on Harmony(localnet) and Ethereum(localgeth)
yarn deploy-localgeth
yarn deploy-localnet

# Start the relayer (note: replace the etherum light client address below)
yarn cli ethRelay relay http://localhost:8645 http://localhost:9500 0x0b84F276Ee85dD856Fb920dE270acF388688aeeA -d ./src/cli/.dag

# Map the Tokens
# map <ethUrl> <ethBridge> <hmyUrl> <hmyBridge> <token>
yarn cli Bridge map http://localhost:8645 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22 http://localhost:9500 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22 0x4e59AeD3aCbb0cb66AF94E893BEE7df8B414dAB1

# cross transfer ERC20 from eth to hmy (receipt is the recipient address)
# crossTo <ethUrl> <ethBridge> <hmyUrl> <hmyBridge> <token> <receipt> <amount>
yarn cli Bridge crossTo http://localhost:8645 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22 http://localhost:9500 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22 0x82305ac469bc60D88D66b7259e3789fB8CD54A88 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 100

# cross transfer HRC20 from hmy back to eth (receipt is the recipient address)
# crossBack <hmyUrl> <hmyBridge> <ethUrl> <ethBridge> <token> <receipt> <amount>
yarn cli Bridge crossBack http://localhost:9500 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22  http://localhost:8645 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22 0x017f8C7d1Cb04dE974B8aC1a6B8d3d74bC74E7E1 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 100
```

## Setting up the codebase

**Clone this repository**
`git clone https://github.com/harmony-one/horizon.git`

**Initialize node_modules, clean solidity environment and compile contracts**
`yarn init-yarn`
You can check `package.json` to review what this command does, it

## Configuration Overview

### Environment Variables
Environment variables are set in `.env` and used predominately for network and private key configuration. However we also currently use some environment variables to keep track of deployment information and gas costs. These variable must be updated when working with testnet or mainnet environments. 

A `.env.sample` file is provided here is a copy of it annotated to show how to use variables.

```
# These variable should be set once with all the system information
HARDHAT_URL=http://localhost:8545
LOCALNET_URL=http://localhost:9500
DEVNET_URL=https://api.s0.ps.hmny.io/
TESTNET_URL=https://api.s0.b.hmny.io
MAINNET_URL=https://api.harmony.one
LOCALGETH_URL=http://localhost:8645
ROPSTEN_URL=https://ropsten.infura.io/v3/<YOUR INFURA KEY>
ETEHERUM_URL=https://mainnet.infura.io/v3/<YOUR INFURA KEY>
ETHERSCAN_API_KEY=ABC123ABC123ABC123ABC123ABC123ABC1

# These variables are environment specific and need to be updated when changing networks and deploying new contracts.
PRIVATE_KEY=1f84c95ac16e6a50f08d44c7bde7aff8742212fda6e4321fde48bf83bef266dc
HMY_URL=http://localhost:9500
ETH_URL=http://localhost:8645
GAS_LIMIT=6000000
GAS_PRICE=20000000000
ERC20=0x876dEfe099Ff0C2E13b0c7B4b9101859e52c07c6
HMY_TOKEN_LOCKER=0x4c97F77fa1D2ceB60A6Ee76929439B33D34A219A
ETH_TOKEN_LOCKER=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

*Note: moving forward we may move to using configuration from `hardhat.config.ts` for gas information and the `deployments` folder for deployment information`.*

## Setting up the Infrastructure 

### Network Overview

| Environment | Network   | Description                 | Notes                          |
| ----------- | --------- | --------------------------  | ------------------------------ |
| Local       | localnet  | Harmony local network       | local build                    |
| Local       | hardhat   | Ethereum local network      | local build                    |
| Local       | localgeth | Ethereum local network      | local build                    |
| Devnet      | devnet    | Harmony developer network   | hosted by Harmony              |
| Testnet     | testnet   | Harmony test network        | hosted by Harmony              |
| Testnet     | ropsten   | Ethereum test network       | hosted using infura or alchemy |
| Production  | mainnet   | Harmony production network  | hosted by harmony              |
| Production  | ethereum  | Ethereum production network | hosted using infura or alchemy |

*Note: network configuration can be found in hardhat.config.ts and we have a harmony specific focus (e.g. localnet, devnet, testnet and mainnet refer to Harmony networks) and Ethereum networks are defined by name (e.g. hardhat, localgeth, ropsten and ethereum)*

### Running Local Nodes

Initial data, including DAG and blockchain data for localgeth can be found [here](https://drive.google.com/file/d/1NyKfx-2vukDntcj8NmK3BNfblpBhh9rI/view?usp=sharing). This will save developers some time as the generation of DAG 0 can take 2 to 3 hours.
To use this download the file and place it's contents in the same parent directory as where you have cloned the horizon repository. Then use `yarn init-chain` to copy the directories required into local folders. 

**Hardhat Node**
We use hardhat to run a local ethereum node. This allows us to debug using `console.log` and provides additional tools for development. However as deploy scripts are specific to chains. We do not wish to run the deploys when we start a node. 

To start a local hardhat(ethereum) node use
`yarn eth local`
which runs
`npx hardhat node --no-deploy`

**GETH Local Node**
Both hardhat and ganache have difficulty set to zero. Which is incompatible with integration testing. In order to run a local ethereum network we use [a local geth private network](https://geth.ethereum.org/docs/interface/private-network) and follow these instuctions
* [installation](https://geth.ethereum.org/docs/install-and-build/installing-geth)

If you want to use the pregenerated blockchain and dag data (Recommended).
Copy and uncompress [this zip file](https://drive.google.com/file/d/1NyKfx-2vukDntcj8NmK3BNfblpBhh9rI/view?usp=sharing) to the same parent directory as your horizon repository and the run `yarn init-chain`
* `yarn localgeth` : runs a local geth network

If you want to generate the data yourself do the following
```
cd localgeth
geth init --datadir data genesis.json
yarn localgeth
```
*Note: when generating your own data and dag you will also need to update `MerkleRoot.sol` with the encoded root information which you can retrieve by running the relayer and seeing `proofs.root`.*

*Note: we considered puppeth (which builds using docker) and [ethUtils](https://github.com/ethersphere/eth-utils) (which are some helper scripts) but both seemed old and outdated)
* [Running a Private Network](https://geth.ethereum.org/docs/getting-started/private-net)
* [Creating a Private Network](https://medium.com/@niceoneallround/creating-a-private-ethereum-network-on-a-mac-c417ab971055)


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

* [Here](https://ropsten.oregonctf.org/) is a ropsten faucet.
* [Here](http://dev.faucet.easynode.one/) is a devnet faucet.
* [Here](https://faucet.pops.one/) is a testnet faucet.

To fund your harmony account use the [harmony cli](https://docs.harmony.one/home/general/wallets/harmony-cli) or metamask and transfer funds from the following account.

## Smart Contracts

For a detailed view of smart contracts and there relationships see [inheritance-graph](./inheritance-graph.png).
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

*Note: `HMY_URL` and `ETH_URL` must be updated in `.env` when deploying to testnet or mainnet. As we use these variables in the deploy scripts (e.g. to get block headers). Moving forward this should be replaced to construct the urls based on the `--network` flag passed in the command.*

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

*Note: `ethWeb3.js` curretnly uses one privateKey for all environments `privateKey = process.env.PRIVATE_KEY)` it is recommended to use the Harmony Localnet private key above and transfer funds to it (e.g. using metamask) from the hardhat account 0 (the deployer account) before deployments.*

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
| Harmony  | EthereumLightClient.sol   | `yarn cli ELC deploy -b 0 -u "http://localhost:8645" "http://localhost:9500"`| Can also pass an rlp Header |
| Harmony  | TokenLockerOnEthereum.sol | `yarn cli Bridge deploy http://localhost:8645 http://localhost:9500`  |  One command deploys both lockers on Ethereum and Harmony   |
| Harmony  | EthereumProver.sol        | `yarn cli EVerifier deploy "http://localhost:8645"` | |
| Harmony  | FaucetToken.sol           | `yarn cli Bridge deployFaucet "http://localhost:9500" -m 10000` | Testing Only |
| Harmony  | EthereumLightClient.sol   | `yarn cli Bridge deployFakeClient "http://localhost:9500"` | TESTING ONLY **Need to clarify whether this is needed** |
| Ethereum | HarmonyLightClient.sol    |                       |              | **Do we deploy this?**
| Ethereum | TokenLockerOnHarmony.sol  |  `yarn cli Bridge deploy http://localhost:8645 http://localhost:9500`  | One command deploys both lockers on Ethereum and Harmony  |
| Ethereum | FaucetToken.sol           | `yarn cli Bridge deployFaucet "http://localhost:8645" -m 10000`                           | Testing Only |
| Ethereum  | EthereumLightClient.sol   | `yarn cli Bridge deployFakeClient "http://localhost:8645"` | TESTING ONLY **Need to clarify whether this is needed** |


### 2: Generate DAG Merkle Tree
A DAG can be generated for hardhat for block 0 using
`dagProve blockProof -b 0 -u http://localhost:8645 -d ./src/cli/.dag`
A sample log for this can be found [here](https://gist.github.com/johnwhitton/6cba77d4c8d2fe0a7a136598ff19b5d6)

A zipped version of the folder can be found [here](https://drive.google.com/file/d/1h4E6vpo-6axB8rwBjpGfFvcmrHM1Zu4F/view?usp=sharing). This can be unzipped and the `0` folder can then be moved to `./src/cli/.dag.`

### 3: Relay Bocks Between the Two Chains
`ethRelay` calls `blockRelayLoop` to relay all blocks. It will generate a DAG if one does not exists. You can run this using the following command and leave this running in a seperate window.
`yarn cli ethRelay relay http://localhost:8645 http://localhost:9500 0xa210f356046b9497E73581F0b8B38fa4988F913B -d ./src/cli/.dag`

*Note: currently when running locally we get the error `ethash local wrong!` generated by `verifyHeader` in  `src/eth2Hmy-relay/lib/DagProof.js`. The log can be found [here](https://gist.github.com/johnwhitton/3cfc746cb5e5cc5c469b6638f439dd3b)

* Using the Ethereum Light Client
`yarn cli ELC status http://localhost:9500 0x7e88a2e433222E4162d70Bfb02FB873c0c1cf508`
Gives an error calling blocksByHeight
```
inalityConfirms: 0
getBlockHeightMax: 0
(node:93843) UnhandledPromiseRejectionWarning: Error: Returned values aren't valid, did it run Out of Gas? You might also see this error if you are not using the correct ABI for the contract you are retrieving data from, requesting data from a block number that does not exist, or querying a node which is not fully synced.
```

### 4: Bridge Tokens


* Deploying Bridged Tokens: `node src/cli/index.js  Bridge deploy http://localhost:8645 http://localhost:9500`

### Notes and recommendations
See [TASKS.md](./TASKS.md)

## Example End to End Testing Testnet
```
yarn deploy-ropsten
yarn deploy-testnet
yarn cli ethRelay relay https://ropsten.infura.io/v3/32cb9c57bfe447a99ea34e30195b2d10 https://api.s0.b.hmny.io 0x017f8C7d1Cb04dE974B8aC1a6B8d3d74bC74E7E1 -d ./src/cli/.dag
```

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


