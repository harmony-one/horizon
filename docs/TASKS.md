# Development Tasks
This document is being used to track many granular tasks and for development discussions. The goal is this document will become redundant and replaced with issues and pull requests for development efforts. 

Product Management, including rollout strategies and timelines will be managed seperately. An initial launch preparation, which is somewhat outdated, can be found [here](https://harmonyone.notion.site/Trustless-Eth-bridge-launch-prep-dde21137582d4ddabc32828abeea0752).

## Process Overview
- [x] Run Local Networks
- [x] Deploy Contracts
- [x] Run Relayer (proceses blockHeaders on Harmony with EthereumLightClient.sol)
    1. Creation of DAG
    2. Configure the first block we want to transfer
- [x] Run Relayer 
    1. process blockHeaders on Ethereum with HarmonyLightClient.sol
    2. Verify block Headers
- [ ] Configure Bridge
    1. Bind the bridge contracts (call Bind Function on each contract see `cli/bridge/contract.js`) 
- [ ] Create Bridged Tokens
    1. Map the deployed tokens `map http://localhost:8645 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 http:localhost:9500 0xB75DA069E82064e0c9895b11F571aD99FDFd231D 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9`
**Here is the Logic (call execution overview) when Mapping Tokens across Chains**
1. Bridge Map is called in src.cli.index.js and it calls tokenMap which
2. Get srcBridge Contract (on Ethereum)
3. Get destBridge Contract (on Hamony)
4. Call IssueTokenMapReq (on the Ethreum Locker)
5. Send the IssueTokenMapReq.hash to Harmony (CrossRelay first call)
5.1. This gets the proof of the transaction on Ethereum via prover.ReceiptProof
5.2 Then validateAndExecuteProof on Harmony via ExecProof which calls the HarmonyTokenLocker.ExecProof
6. We then prove the Harmony mapping acknowledgment on Ethereum (Cross Relay second call)
6.1 This gets the proof of the acknowledgement transaction on Harmony via prover.ReceiptProof
6.2 Then validateAndExecuteProof on Ethereum via ExecProof which calls the EthereumTokenLocker.ExecProof
7. Upon completion of tokenMap control is passed back to Bridge Map which
8. Calls TokenPair on Ethereum
9. Calls ethTokenInfo to get the status of the ERC20
10. Calls hmyTokenInfo to get the tokenStatus on Harmony

*Note: `validateAndExecuteProof` is responsible for creation of the BridgeTokens on the destination chain it does this by calling `execute` call in `TokenLockerLocker.sol` which then calls the function `onTokenMapReqEvent` in `TokenRegistry.sol` which creates a new Bridge Token ` BridgedToken mintAddress = new BridgedToken{salt: salt}();` and then initializes it.*

*Note: The shims in `ethWeb3.js` provide simplified functions for `ContractAt`, `ContractDeploy`, `sendTx` and `addPrivateKey` and have a constructor which uses `process.env.PRIVATE_KEY`.*
- [ ] Transfer Tokens
   1. Lock Token (on Ethereum)
   2. Relay the Block (to Harmony)
   3. Prove the Transaction
   4. Mint token on Harmony


**Additional monitoring tools (non critical)**
* dagProve: `DAG Merkel Tree cli`
* ELC: `ethereum ligth client cli`
* EProver: `get receipt proof of a transaction from ethereum`
* EVerifier: `ethereum receipt verify cli`

## Functionality Assumptions and Process Items
- [ ] DAG Production
  * Are relayers compensated for creating DAG's?
  * What is the ideal number of epochs DAGs are created for? 
  * How are DAG's distributed to relayers
  * Aare there any performance issues with creating multipe (e.g. a years worth) of DAGs up front?
  - [ ] Implementation Review: Process of MerkleRoot.sol updating the contract, which currently appears to be linked to an upgrade to the proxy of the whole EthHash.sol and ELC implementation. Would prefer to do this less frequently and ideally only upgrade the merkelRoot library (see EIP2535 Diamonds). 
- [ ] Gas Fees when Linking or Bridging Tokens.
  * Are Gas fees on the receiving chain paid by users or the bridge.
  - [ ] Implementation Review: Currently for the CLI we are using one wallet as we move forward to integrating with the front end, the various providers and signers need to be accomodated.

### Functional Task Breakdown
*Note: The development approach is to focus on bridging tokens from Ethereum to Harmony first and then Harmony to Ethereum. This means that tasks such as Relaying block headers, mapping tokens and transferring tokens from Harmony to Ethereum will be worked on after end to end Ethereum to Harmony is working.*

*Also note there is a dependency on the relayer to relay the block headers before transactions can be proved. This means that we need to seperate the logic in the cli to perform the local transactions independently of tasks such as `validateAndExecuteProof` on the destination chain.*

**Relayer**
- [ ] Enhance Relay Process to optimize and include batch transfer of headers

**Bridge**
- [ ] Seperate local transaction from the bridging of proofs 

**Proofs**
- [ ] Review `validateAndExecuteProof` logic and the population of input fields.

**CLI**
- [ ] Remove (or replace) deployment tasks in the CLI as we can use hardhat.

**API**

**FrontEnd**

**Infrastructure**
- [ ] Slow down localgeth production of blocks to better enable testing and be more representative of Ethereum Mainnet.

### Notes and recommendations

**Functionality Testing**
- [x] Deployments Work (using Proxies)
- [x] Relayer Works (eth to harmony)
- [ ] Bridge Works (token transfer)
- [ ] DAG Generation Process works (this is not chain specific)

**Code Optimization**
- [ ] Write bridge.js proof calls (currently passing incorrect parameters to Harmony TokenLocker `validateAndExecuteProof`)
- [ ] Update ethWeb3 and hmyWeb3 to check result of gas calc and default to env variables
- [ ] Ensure compatablity with [node version 18](https://nodejs.org/en/about/releases/) [hardhat compatability](https://hardhat.org/reference/stability-guarantees#node.js-versions-support) intital test with node version 18.4.0 gave an error on deploy `Error HH108: Cannot connect to the network localgeth.` see [here](https://github.com/NomicFoundation/hardhat/pull/2705)
- [ ] Capture all Payloads for relay and TokenMap 
- [ ] Update unit tests to use sample input files
- [ ] Upgrade CLI commands into functional stages (e.g.
  - [ ] infrastructure
  - [ ] deployment *Note: may use hardhat cli for deployments*
  - [ ] relayer (ethRelayer and ethHashProof (DAG))
  - [ ] bridge (bridge, eprover, tokenLocker, tokenRegistry, etc))
- [ ] Review SmartContract error handling (e.g. [custom errors](https://blog.ricmoo.com/highlights-ethers-js-may-2021-2826e858277d))
- [ ] Consolidate Packages relayer, tokenLocker(bridge) see [sushiswap sdk example](https://github.com/sushiswap/sdk/tree/canary/packages)
- [ ] Review use of ethereumjs and ethereumjs-util in elc and eprover
- [ ] Improve error validation for invalid parameters for contract calls see [this gist](https://gist.github.com/johnwhitton/90e2ed533001f5293b0edbd58d9e2f18). *Note options include [callStatic](https://docs.ethers.io/v5/api/contract/contract/#contract-callStatic) to validate the function without updates, [queryFilter](https://docs.ethers.io/v5/api/contract/contract/#Contract-queryFilter) to retrieve the events. But these only occur if the contract was called with valid input parameters.*

**Deploy updates**
- [ ] Parameterize deploys (evaluate using [hardhat tasks](https://hardhat.org/guides/create-task) see [here](https://stackoverflow.com/questions/69111785/hardhat-run-with-parameters))
- [ ] Modify Deploy scripts to dynamically use network (e.g. for getting blockHeader) instead of the current use of environment variables `HMY_URL` and `ETH_URL`which need to be changed in `.env` when deploying to new networks.
- [ ] Update MerkleRoot.sol to have an initialize function and so we can deploy without modifying the contract
- [ ] Add linkage of Token Lockers to Deployments (migrate `lib\config.js` to a deploy task)
- [ ] Write and Test Upgrade Process 
- [ ] Update initData on Google Drive with new localgeth data with only 50 blocks
- [ ] For deployments use [hardhat-deploy](https://github.com/wighawag/hardhat-deploy#deploying-and-upgrading-proxies) instead of [openzepplin Upgrades Plugin](https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades)


**Outstanding Issues**
- [ ] Review [bridgeMapError](https://gist.github.com/johnwhitton/14b2a62f18c53e76d4bdd1f97759e5fd)


**Production ready improvements**
- [ ] Prepare demo of local environment and testing
- [ ] Review [slither analysis](https://gist.github.com/johnwhitton/31a40cd54210518a48945e270f15199c) and fix issues and vunerabilities
- [ ] Improve validation rather than throwing exceptions (e.g. when calling `yarn cli ELC deploy -b 0 -u "http://localhost:8645" "http://localhost:9500")` we get exceptions when the Ethereum url is not populated



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

### Completed
- [x] Update .env Keys to only have two values ethereum and Harmony
- [x] Update funding process for local environment to send funds to test account
- [x] Update ABI definitions to use `./build/contracts`
- [x] Consolidate abi's currently under different folders (e.g. `cli/bridge/abi`, `cli/elc/abi`, `cli/eprover/abi`) can use the automatically generated abis under `build/Contracts` e.g. `build/Contracts/TokenLockerOnEthereum.sol/TokenLockerOnEthereum.json` if this is not preferred can update deploy scripts to automatically update current disparate directories on build.
- [x] Resolve `ethash local wrong!` generated by `yarn cli ethRelay relay http://localhost:8645 http://localhost:9500 0x7e88a2e433222E4162d70Bfb02FB873c0c1cf508 -d ./src/cli/.dag` log can be found [here](https://gist.github.com/johnwhitton/3cfc746cb5e5cc5c469b6638f439dd3b) also mentioned [here](https://github.com/harmony-one/horizon/pull/31#discussion_r881611082) This may be related to the fact that hardhat has a difficulty of zero (unless forking) and so mixHash = `0x0000000000000000000000000000000000000000000000000000000000000000` a gist showing sample blockheaders from ethereum, ropsten and hardhat can be found [here](https://gist.github.com/johnwhitton/e1e0d16156223a5b138b8381f4cc989c)
- [x] Include config.js and replace use of process.env throughout codebase
- [x] Add Logger similar to [this](https://github.com/polymorpher/one-wallet/blob/master/code/test/util.js#L25) with optional [debug](https://github.com/polymorpher/one-wallet/blob/master/code/lib/debug.js) and using a config.js similar to [this](https://github.com/polymorpher/one-wallet/blob/master/code/config.js)
- [x] Consolidate dag data under data folder
- [x] Add dependency for LightClient to TokenLocker on Deploy
- [x] Create backup branch [refactorBeforeProxyChanges](https://github.com/johnwhitton/horizon/tree/refactorBeforeProxyChanges)
- [x] Update deploys to use proxies 
- [x] Remove hardcoded deploy variables (use `config.js` instead)
- [x] Remove deploy tasks from lib and place under deploy
- [x] Clean up lib (move deploys to deploy and tests to test and remove upgrade)
- [x] Upgrade  isomorphic-rpc `yarn upgrade isomorphic-rpc@1.2.2` to fix `node:53398) UnhandledPromiseRejectionWarning: Error: {"jsonrpc":"2.0","id":1,"error":{"code":-32601,"message":"the method toJSON does not exist/is not available"}}`
- [x] Move from web3 to ethers
- [x] make consistent use of `ethers.js` replacing libraries such as `web3`, `rlp`, `bigNumber`, `ethereumjs-util`. Recommendation is `ethers` vs `web3` based on hardhat integration [this article](https://moralis.io/web3-js-vs-ethers-js-guide-to-eth-javascript-libraries/), [these stats](https://npm-stat.com/charts.html?package=ethers&package=web3&from=2021-01-01&to=2021-06-01) and these comments `Ethers.js loads slightly faster thanks to its noticeably smaller size, which may offer better performance.` and `However, the blockchain industry as a whole is slowly migrating towards a younger alternative – Ethers.js. `
- [x] Consolidate helpers for cli and lib (create one js file per are in cli if needed e.g. `bridge.js`)
  - [x] `src/cli/bridge` => `src/bridge`
  - [x] `src/cli/elc` => `src/elc.js`
  - [x] `src/cli/eth2hmy-relay` => `src/eth2hmy-relay`
  - [x] `src/cli/ethashProof` => `src/ethashProof` (this is DAG related)
  - [x] `src/cli/verifier` => `src/eprover`
  - [x] `src/cli/lib` => `lib` (also update ethWeb3 and hmyWeb3 to use ethers)
- [x] Configure [Sepolia](https://sepolia.dev/) Testnet *Note: Sepolia is not supported by Infura or Alchemy, bug we may not have to host our own node as Sepolia has a hosted endpoint https://rpc.sepolia.dev*
