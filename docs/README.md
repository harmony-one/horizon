# Horizon Bridge Documentation and API reference

# Overview

This document gives a technical overview of the Horizon Bridge including build, deployment and testing information. For more information see [Harmony's Horizon Bridge Rollout strategy](https://harmonyone.notion.site/Trustless-Eth-bridge-launch-prep-dde21137582d4ddabc32828abeea0752), the [Horizon Whitepaper](./assets/horizon-whitepaper.pdf) and the [IRIS Bridge Presentation](https://docs.google.com/presentation/d/1suGKZ12n7aziudg6E2plxEfYgIE_pQZZGCtwKy6j0m0/edit#slide=id.g48989ac23a_0_0).

The current state of the project is that we are testing using a Harmony Local Node and brdiging to Ropsten. For the client we will use the CLI and moving forward will use the new UI
* **Harmony Node**: we use a [harmony local node](https://github.com/harmony-one/harmony#dev-docker-image) this can be run via docker. Note at the time of writing this the local build should be done from [ganesha's mmr-hard-fork branch](https://github.com/gupadhyaya/harmony/tree/mmr-hard-fork). **There is a pull request which needs to be pushed to Harmony Testnet to enable the bridging functionality. [we need this PR to be pushed to testnet (should be done by May 27th, 2022)](https://github.com/harmony-one/harmony/pull/3872)**
* **Ethereum Node**: For fully trustless bridge we need the bls signature verification precompile to be available on ethereum [eip-2537](https://eips.ethereum.org/EIPS/eip-2537), however this won't be a blocker, as we can initially do permissioned relayers, later adopt optimistic approach, etc. there are many fallback plans for this. 
* **DAG genertion** : Takes several hours to run Ganesha has a machine to do this and shares the latest DAG info from Ropsten using [google drive](https://drive.google.com/file/d/1FqLCO5oc1xDYNMuub7xAqnb6kfohdf-U/view?usp=sharing). The epoch logic is the block Number divided by 30,000 so current Ropsten EPOCH is block 12280236 / 30000 = 409 which is the DAG info shared above. **Moving forward we need to update DAG information for every new EPOCH**
* **CLI Relayer** : Relays the blocks, this is initially written in javascript as a Proof of concept and may be implemented in other languages moving forward. **Once the Relayer has begun we need to continually relay each block**
* **Client**: The client is used to Process transactions this is done by locking the Token using the TokenLocker.sol contract (e.g. TokenLockerOnEth.Sol AND TokenLockerOnHarmony.sol)
Currently only ERC20 are supported. Moving forward ERC721 and ERC1155 as well as operations on smart contracts will also be supported. For now all client transactions will be done using the CLI. Moving forward  the current bridge (bridge.harmony.one) will be migrated to https://bridge-validator-1.web.app/
* **Front End**: The current [bridge.harmony.one](https://bridge.harmony.one/busd) is being migrated to a new [bridge](https://bridge-validator-1.web.app/busd). Work is being done in the [ehthmy-brige.frontend repository](https://github.com/harmony-one/ethhmy-bridge.frontend) and initial feedback is documented [here](https://github.com/harmony-one/ethhmy-bridge.frontend/issues/155). *Note: Jenya also built a fresh frontend for upcoming trustless bridge: https://github.com/harmony-one/horizon-trustless-frontend but most likely, we will stick to the first one.*

**Current Status**
* End to End Testing : Has never been succesfully completed
* Smart Contract Tests: Have errors in them.

**Testing Summary**

| #   | Status | Step                          | Notes |
| --- | ------ | ----------------------------- | ----- |
| 1   | *PASS  | Infrastructure Setup          | Working with Local Net until [PR 3872](https://github.com/harmony-one/harmony/pull/3872) [fork](https://github.com/gupadhyaya/harmony/tree/mmr-hard-fork) is pushed to Testnet |
| 2   | TBD    | Ropsten Smart Contract Deploy | | 
| 3   | TBD    | Harmony Smart Contract Deploy | |
| 4   | TBD    | Relayer Running               | |
| 5   | TBD    | End To End Testing            | |

**Migration Strategy**
* Smart Contract use Hardhat with Typescript and ethers(instead of web3)
  * Replace all web3 with ethers
  * Use typescript for tests.
  * Use Hardhat for deploy scripts
  * write tests
* docs: new folder for documentation
* docs/assets => migrated from assets
* docs/solidity: contains generated solidity documentation
* deploy: new folder for deployment scripts (using hardhat-deploy and logic from scripts)
* src: new folder for typescript source files 
* src/lib: (migrated from scripts)
* src/cli: (migrated from cli)
* src/(elc, eprover, eth2hmy-relay): migrated from tools(elc, eprover, eth2hmy-relay)

**RollOut Strategy [see here for launch](https://harmonyone.notion.site/Trustless-Eth-bridge-launch-prep-dde21137582d4ddabc32828abeea0752)**
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

# Developer and Testing guide
## Setting up the codebase

**Clone this repository**
`git clone https://github.com/harmony-one/horizon.git`

**Initialize node_modules, clean solidity environment and compile contracts**
`yarn init-yarn`
You can check `package.json` to review what this command does, it
* Installs all node_modules `yarn install; cd ./src/cli; yarn install; cd ../elc; yarn install; cd ../eprover; yarn install; cd ../eth2hmy-relay; yarn install; cd ../..;`
* cleans the solidity(hardhat) artifacts: `npx hardhat clean`
* compiles all the solidity contracts: `npx hardhat compile`

The complete command in `package,json` is as follows
`"init-yarn": "yarn install; cd ./src/cli; yarn install; cd ../elc; yarn install; cd ../eprover; yarn install; cd ../eth2hmy-relay; yarn install; cd ../..; hardhat clean; hardhat compile"`


*Note: you can see the CLI commands available by typing*
`node index.js [command] -h`

*Note: you can see the CLI commands available by typing*
`node index.js [command] -h`

## Setting up the Infrastructure 

### Infura Project Setup

We use an an infura account to integrate with a Ropsten Node.

Create an [Infura Account](https://infura.io/) and create an ethereum project. Add the INFURA_PROJECT_ID to the `.env` file.

### Building 

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
which calculate merkle root for epochs from [start, start+n)

**Questions**

1. When do you need to run `node index.js dagProve blockProof`?
2. Do you need to generate a new DAG information on each EPOC change?
3. Where is this currently hosted?
4. Where do we want to deploy this long term?

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

**Proxies and Upgradability**
In the original codebase deployments of contracts where made upgradeable via the use of [upgrade scripts](https://github.com/harmony-one/horizon/tree/main/scripts/upgrade) and `await upgrades.deployProxy` (e.g. see [deploy_erc20.js](https://github.com/harmony-one/horizon/blob/main/scripts/deploy_erc20.js))

Alernate ways to achieve this are
1. Hardhat Upgrades: Open Zepplin provides an [upgrade plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/hardhat-upgrades) via [this npm package](https://www.npmjs.com/package/@openzeppelin/hardhat-upgrades).  
2. [EIP-2535 Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535): Diamonds are [supported by hardhat-deploy](https://github.com/wighawag/hardhat-deploy/tree/master#builtin-in-support-for-diamonds-eip2535) and have [reference-implementations](https://github.com/mudgen/diamond-3-hardhat).

Recommendation: Diamonds appear to be the more robust solution and will enable upgrading of functionality long term as we evolve our relay and verification functionality. If time is a constraint can use Hardhat Upgrades initially and then migrate to Diamonds at a later point. However this will incur a migration cost.

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
8. Are there any dependencies on tools or scripts for deployment?
9. What is the purpose of ``yarn libInit` in the [elc installation instructions](https://github.com/johnwhitton/horizon/tree/main/tools/elc#installation-instructions)

## Deploying the Relayer
The eht2hmy-relayEth2Hmy relay downloads the Ethereum block headers, extract information and relay it to ELC smart contract on Harmony. It exists in the [tools folder](https://github.com/johnwhitton/horizon/tree/main/tools/eth2hmy-relay) and can be run via the [cli](https://github.com/johnwhitton/horizon/tree/main/cli#ethereum-block-relay-cli)

**Original documentation**
Original documentation can be found [here](https://github.com/johnwhitton/horizon/tree/main/cli#ethereum-block-relay-cli) and says

> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ethRelay getBlockHeader` get block header from ethereum.
```
node index.js ethRelay getBlockHeader https://ropsten.infura.io/v3/<project-id> 11266872
```
2. `node index.js ethRelay relay` constantly relay blocks from Ethereum to Harmony.

**Questions**

1. Can we simply run `node index.js ethRelay relay` to run the relayer?
2. Are there any other components which need to be run?
3. Are there any other infrastrcture tasks which need to be setup prior to running the relayer?


## End to End Testing
End to End testing currently consists of mapping ERC20 tokens from Harmony to Ethereum and transferring them accross the chains. This is done via the [ClI](https://github.com/johnwhitton/horizon/tree/main/cli) using the following commands

5. `node index.js Bridge map` map ERC20 from ethereum to harmony.
6. `node index.js Bridge crossTo` cross transfer ERC20 from ethereum to harmony.
7. `node index.js Bridge crossBack` cross transfer HRC20 from harmony back to ethereum.

There are also two scripts written to facilitate testing. 
1. [test.js](https://github.com/johnwhitton/horizon/blob/main/scripts/test.js)
2. [newtests.js](https://github.com/johnwhitton/horizon/blob/main/scripts/newtest.js)

Also [end2end.js](https://github.com/johnwhitton/horizon/blob/main/scripts/end2end.js) which does not have any code in it.

**Original Documentation**
Original documentation for the CLI contains [Bridge CLI](https://github.com/johnwhitton/horizon/tree/main/cli#bridge-cli), [Ethereum Receipt Prove CLI](https://github.com/johnwhitton/horizon/tree/main/cli#ethereum-receipt-prove-cli) and [Ethereum Receipt Verifier CLI](https://github.com/johnwhitton/horizon/tree/main/cli#ethereum-receipt-verifier-cli).

The assumption is that you need to just run the map, crossTo and crossBack functions.

**Questions**
1. Can testing be done via the CLI using he map, crossTo and crossBack functions?
2. What additional setup or components need to be installed/run?
3. Has end to end testing been completed?
4. What outstanding development tasks are there? 


## Smart Contract Testing
Smart contract testing has a [test folder](https://github.com/johnwhitton/horizon/tree/main/test) which contains [bridg.hmy.js](https://github.com/johnwhitton/horizon/blob/main/test/bridge.hmy.js) however at the time of writing this test was not working.

Tests are set up in the tests folder and are run using hardhat.

`yarn test` is set up as a script to run `npx hardhat test`

**Questions**
1. Is there any other branches where tests have been written?
2. Are there any dependencies on tools or utils for these tests? 

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


### Additional References
* [Additional Bridge Research](https://eavenetwork.notion.site/Bridges-713be29794df41b4aeb65c26d6a0404b): Other Bridging techniques including Nomad, Cosmos, Solana Wormhole, Snowfork and XCMP.
* [Nomad's Docs](https://docs.nomad.xyz/#home):  Nomad's optimistic rollup hub and spoke appoach
* [EIP-235: Diamonds, Multi-Facet Proxy](https://eips.ethereum.org/EIPS/eip-2535): Smart contract compasability 
