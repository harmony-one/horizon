# Design

## Overview 

This document reviews the current implementation, development tasks that need to be done to support POW and offers some thoughts on next steps to support Ethereum 2.0 and other chains. Further thoughts on Multichain Design including a review of other Multichain Bridges is included in [Multichain Trustless Bridge : Draft](./MultiChainTrustlessBridgeDraft.pdf)

The current design needs to be updated for ETH 2.0. This involves removing the ETHHASH logic and SPV client and replacing with MMR trees per epoch and checkpoints similar to Harmony Light Client on Ethereum. However it is unclear whether ETH 2.0 support MMRs. Need further review of [Vitalik’s Annotated Ethereum 2.0 Spec](https://notes.ethereum.org/@vbuterin/SkeyEI3xv), [Prysm Documentation](https://docs.prylabs.network/docs/how-prysm-works/prysm-validator-client) and [prysm github](https://github.com/prysmaticlabs/prysm).


## Next Steps

Following are some of the improvements needed broken down by functional areas.

### Ethereum Light Client
1. Needs to be refactored to support Proof of Stake (POS) and remove POW and DAG Generation. Following are some documents for review to see whether we can implement a Ethereum Light Client potentially interacting with the Prysm Implementaion of Consenuse and using Merkle Mountain Ranges similar to Harmony.
    * Harmony [MMR PR Review](https://github.com/harmony-one/harmony/pull/3872) and [latest PR](https://github.com/harmony-one/harmony/pull/4198/files)
    * ETH 2.0 Review
        * [Beacon Chain Specification](https://github.com/ethereum/consensus-specs/blob/master/specs/phase0/beacon-chain.md)
        * [Extended light client protocol](https://notes.ethereum.org/@vbuterin/extended_light_client_protocol)
        * [Altair Light Client -- Light Client](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md)
        * [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md)
2. Queuing mechanism should be implemented to queue bridge transactions. The queue can be polled as part of the block relay functionality to process bridge transactions once the blocks have been relayed.
3. Consider whether we can use p2p messaging to receive published blocks rather than looping and polling via an RPC.

### Harmony Light Client
1. Needs to implement a process to `submitCheckpoint`.
2. `eprove` logic needs to be reviewed
3. Queuing mechanism should be implemented to queue bridge transactions. The queue can be polled as part of the `submitCheckpoint` functionality to process bridge transactions once the blocks have been relayed. 
4. Need to facilitate the core protocol [MMR enhancements PR](https://github.com/harmony-one/harmony/pull/4198/files) 


### Transaction Sequencing 
Sequencing of Transactions: Needs to be implemented and `TokenMap` in `bridge.js` needs to be refactored. Below is the current sequence flow and areas for improvements.

1. Ethereum Mapping Request
2. Relay of Block to EthereumLightClient.sol on Harmony
    * The block has to be relayed before we can process the Harmony Mapping request, as we have just executed the transaction the relayer usually has not relayed the block so this will fail.
    * There must be an additional 25 blocks on Ethereum before this block can be considered part of the canonical chain. 
    * This logic needs to be rewritten to break down execution for 1. the ethereum mapping request 2. After a 25 block delay the Harmony Proof validation and executing the Harmony Mapping Request**  
3. Harmony Mapping Request
4. Relay of Checkpoint to HarmonyLightClient.sol on Ethereum
    * A `submitCheckpoint` in `HarmonyLightClient.sol` needs to have called either for the next epoch or for a checkpoint, after the block the harmony mapping transaction was in.**
    * Automatic submission of checkpoints to the Harmony Light Client has not been developed as yet. (It is not part of the `ethRelay.js`). And so the checkpoint would need to be manually submitted before the Ethereum Mapping could take place.
5. Etherem Process Harmony Mapping Acknowledgement

### Bridge Functionality

1. Need to support mapping Harmony Tokens to Ethereum 

### MultiChain Support

1. Need to support other chains
    * EVM: BSC, Polygon, Avalanche, Arbitrum, Optimism
    * Bitcoin
    * NEAR
    * Solana
    * Polkadot
2. Links to initial Design thoughs including reviews of cross chain messaging protocols and other multichain bridges can be found in [Multichain Trustless Bridge : Draft](./MultiChainTrustlessBridgeDraft.pdf)

## Current Implementation Walkthough
Following is a detailed walk though of the current implementation of the Ethereum Light Client and the flow for mapping tokens from Ethereum to Harmony. 

## Ethereum Light Client (on Harmony)

**Design**
Existing Design
1. DAG is generated for each Ethereum EPOCH: This takes a couple of hours and has a size of approx 1GB.
2. Relayer is run to replicate each block header to the SPV Client on Harmony.
3. EthereumLightClient.sol addBlockHeader: Adds each block header to the Ethereum Light Client.
4. Transactions are Verified

**Running the Relayer**
```
# Start the relayer (note: replace the etherum light client address below)
# relay [options] <ethUrl> <hmyUrl> <elcAddress>   relay eth block header to elc on hmy
 yarn cli ethRelay relay http://localhost:8645 http://localhost:9500 0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22
 ```

**Implementation**
1. DAG Generation can be done explicity by calling `dagProve` from the CLI or it is done automatically by `getHeaderProof` in `ethHashProof/BlockProof.js` which is called from `blockRelay` in `cli/ethRelay.js`.
2. Relaying of Block Headers is done by `blockRelayLoop` in `cli/ethRelay.js` which
    * Reads the last block header from EthereumLightClient.sol
    * Loops through calling an Ethereum RPC per block to retrieve the blockHeader using ` return eth.getBlock(blockNo).then(fromRPC)` in function `getBlockByNumber` in `eth2hmy-relay/getBlockHeader.js`
3. Adding BlockHeaders is done by `await elc.addBlockHeader(rlpHeader, proofs.dagData, proofs.proofs)` which is called from `cli/ethRelay.js`. `addBlockHeader` in `EthereumLightClient.sol` 
    * calculates the blockHeader Hash 
    * and checks that it 
        * hasn't already been relayed,
        * is the next block to be added,
        * has a valid timestamp 
        * has a valid difficulty  
        * has a valid Proof of Work (POW)
    * Check if the canonical chain needs to be replaced by another fork


### Mapping Tokens (Ethereum to Harmony)

**Design**

1. If the Token Has not already been mapped on Harmony
    * Harmony: Create an ERC20 Token 
    * Harmony: Map the Ethereum Token to the new ERC20 Contract
    * Ethereum: Validate the Harmony Mapping Transaction
    * Ethereum: Map the Harmony ERC20 token to the existing Ethereum Token
    * Harmony: Validate the Ethereum mapping Transaction

*Note: The key difference between `TokenLockerOnEthereum.sol` and `TokenLockerOnHarmony.sol` is the proof validation. `TokenLockerOnEthereum.sol` uses `./lib/MMRVerifier.sol` to validate the [Mountain Merkle Ranges](https://github.com/opentimestamps/opentimestamps-server/blob/master/doc/merkle-mountain-range.md) on Harmony and `HarmonyProver.sol`. `TokenLockerOnHarmony.sol` imports `./lib/MPTValidatorV2.sol` to validate [Merkle Patrica Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#merkle-patricia-trees) and `./EthereumLightClient.sol`.*

*Note: `validateAndExecuteProof` is responsible for creation of the BridgeTokens on the destination chain it does this by calling `execute` call in `TokenLockerLocker.sol` which then calls the function `onTokenMapReqEvent` in `TokenRegistry.sol` which creates a new Bridge Token ` BridgedToken mintAddress = new BridgedToken{salt: salt}();` and then initializes it. This uses [(RLP) Serialization](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)*

*Note: The shims in `ethWeb3.js` provide simplified functions for `ContractAt`, `ContractDeploy`, `sendTx` and `addPrivateKey` and have a constructor which uses `process.env.PRIVATE_KEY`.*


**Mapping the Tokens**
```
# Map the Tokens
# map <ethUrl> <ethBridge> <hmyUrl> <hmyBridge> <token>
yarn cli Bridge map http://localhost:8645 0x017f8C7d1Cb04dE974B8aC1a6B8d3d74bC74E7E1 http://localhost:9500 0x017f8C7d1Cb04dE974B8aC1a6B8d3d74bC74E7E1 0x4e59AeD3aCbb0cb66AF94E893BEE7df8B414dAB1
```

**Implementation**

* The CLI calls `tokenMap` in `src/bridge/contract.js` to
    * Instantiate the Ethereum Bridge and Harmony Bridge Contracts
    * Calls `TokenMap` in `scr/bridge/bridge.js` to
        * Issue a token Map request on Ethereum `const mapReq = await src.IssueTokenMapReq(token)`
        * Acknowledge the Map Request on Harmony `const mapAck = await Bridge.CrossRelayEthHmy(src, dest, mapReq)`
        * Issue a token Map request on Harmony `return Bridge.CrossRelayHmyEth(dest, src, mapAck.transactionHash)`
  
**Here is the Logic (call execution overview) when Mapping Tokens across Chains. *NOTE: Currently mapping has only been developed from Ethereum to Harmony (not bi-directional)*.**
1. Bridge Map is called in src.cli.index.js and it calls `tokenMap` in `bridge/contract.js` which
    * Get srcBridge Contract on Ethereum `TokenLockerOnEthereum.sol` from `ethBridge.js` it also instantiates an `eprover` using `tools/eprover/index.js` which calls `txProof.js` which uses [eth-proof npm package](https://www.npmjs.com/package/eth-proof). *Note: this is marked with a //TODO need to test and develop proving logic on Harmony.*
    * Get destBridge Contract on Hamony `TokenLockerOnHarmony.sol` from `hmyBridge.js` it also instantiates an `hprove` using `tools/eprover/index.js` which calls `txProof.js` which uses [eth-proof npm package](https://www.npmjs.com/package/eth-proof).
    * calls `TokenMap` in `bridge.js`
2. `TokenMap` Calls IssueTokenMapReq (on the Ethreum Locker) returning the `mapReq.transactionHash`
    * `IssueTokenMapReq(token)` is held in `bridge.js` as part of the bridge class
    * It calls `issueTokenMapReq` on `TokenLockerOnEthereum.sol` which is implemented by `TokenRegistry.sol`
    * `issueTokenMapReq` checks if the token has already been mapped if not it was emitting a `TokenMapReq` with the details of the token to be mapped. However this was commented out as it was felt that, if it has not been mapped, we use the `transactionHash` of the mapping request` to drive the logic below (not the event). 
3. `TokenMap` calls `Bridge.CrossRelay` with the IssueTokenMapReq.hash to 
    * gets the proof of the transaction on Ethereum via `getProof` calling `prover.ReceiptProof` which calls the eprover and returns `proof` with 
        * `hash: sha3(resp.header.serialize()),`
        * `root: resp.header.receiptRoot,`
        * `proof: encode(resp.receiptProof),`
        * `key: encode(Number(resp.txIndex)) // '0x12' => Nunmber`
    * We then call `dest.ExecProof(proof)` to execute  the proof on Harmony
        * This calls `validateAndExecuteProof` on `TokenLockerOnHarmony.sol` with the `proofData` from above, which
            * requires `lightclient.VerifyReceiptsHash(blockHash, rootHash),` implemented by `./EthereumLightClient.sol`
                * This returns `return bytes32(blocks[uint256(blockHash)].receiptsRoot) == receiptsHash;`
                * **Which means the block has to be relayed first, as we have just executed the transaction the relayer usually has not relayed the block so this will fail** 
            * requires `lightclient.isVerified(uint256(blockHash)` implemented by `./EthereumLightClient.sol`
                * This returns `return canonicalBlocks[blockHash] && blocks[blockHash].number + 25 < blocks[canonicalHead].number;`
                * **Which means there must be an additional 25 blocks on Ethereum before this can be processed. This logic needs to be rewritten to break down execution for 1. the ethereum mapping request 2. After a 25 block delay the Harmony Proof validation and executing the Harmony Mapping Request**  
            * `require(spentReceipt[receiptHash] == false, "double spent!");` to ensure that we haven't already executed this proof
            * gets the `rlpdata` using `EthereumProver.validateMPTProof` implemented by `EthereumProver.sol` which
                * Validates a Merkle-Patricia-Trie proof.
                * Returns a value whose inclusion is proved or an empty byte array for a proof of exclusion
            * marks `spentReceipt[receiptHash] = true;`
            * `execute(rlpdata)` implemented by `TokenLocker.sol` which calls `onTokenMapReqEvent(topics, Data)` implemented by `TokenRegistry.sol` 
                * `address tokenReq = address(uint160(uint256(topics[1])));` gets the address of the token to be mapped.
                * require `address(RxMapped[tokenReq]) == address(0)` that the token has not already been mapped.
                * `address(RxMapped[tokenReq]) == address(0)` creates a new BridgedToken implemented by `BridgedToken.sol`
                    * `contract BridgedToken is ERC20Upgradeable, ERC20BurnableUpgradeable, OwnableUpgradeable` it is a standard openzepplin ERC20 Burnable, Ownable, Upgradeable token
                * `mintAddress.initialize` initialize the token with the same `name`, `symbol` and `decimals` as the ethereum bridged token
                * `RxMappedInv[address(mintAddress)] = tokenReq;` updates the inverse Key Value Mapping
                * `RxMapped[tokenReq] = mintAddress;` updates the Ethereum mapped tokens
                * `RxTokens.push(mintAddress);` add the newly created token to a list of bridged tokens
                * `emit TokenMapAck(tokenReq, address(mintAddress));`
            * `require(executedEvents > 0, "no valid event")` to check if it executed the mapping correctly.
4. We then take the Harmony Mapping `transactionHash` and repeat the above process to prove the Harmony mapping acknowledgment on Ethereum (Cross Relay second call) `return Bridge.CrossRelay(dest, src, mapAck.transactionHash);`
  * gets the proof of the transaction on Harmony via `getProof` calling `prover.ReceiptProof` which calls the eprover and returns `proof` with 
        * `hash: sha3(resp.header.serialize()),`
        * `root: resp.header.receiptRoot,`
        * `proof: encode(resp.receiptProof),`
        * `key: encode(Number(resp.txIndex)) // '0x12' => Nunmber`
    * We then call `dest.ExecProof(proof)` to execute the proof on Ethereum
        * This calls `validateAndExecuteProof` on `TokenLokerOnEthereum.sol` with the `proofData` from above, which
            * `require(lightclient.isValidCheckPoint(header.epoch, mmrProof.root),` implemented by `HarmonyLightClient.sol`
                * `return epochMmrRoots[epoch][mmrRoot]` which means that the epoch has to have had a checkpoint submitted via ` submitCheckpoint` 
            * `bytes32 blockHash = HarmonyParser.getBlockHash(header);` gets the blockHash implemented by `HarmonyParser.sol`  
                * This returns `return keccak256(getBlockRlpData(header));`  
                * `getBlockRlpData`  creates a list `bytes[] memory list = new bytes[](15);` and uses statements like `list[0] = RLPEncode.encodeBytes(abi.encodePacked(header.parentHash));` to perform [Recursive-Length Prefix (RLP) Serialization](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/) implemented by `RLPEncode.sol`
            *  `HarmonyProver.verifyHeader(header, mmrProof);` verifys the header implemented by `HarmonyProver.sol`
                * `bytes32 blockHash = HarmonyParser.getBlockHash(header);` gets the blockHash implemented by `HarmonyParser.sol` as above
                * `valid = MMRVerifier.inclusionProof(proof.root, proof.width, proof.index, blockHash, proof.peaks, proof.siblings);` verifys the proff using the [Merkle Mountain Range Proof](https://github.com/opentimestamps/opentimestamps-server/blob/master/doc/merkle-mountain-range.md) passed `MMRVerifier.MMRProof memory proof` and the `blockHash`.
                * **NOTE: This means that a `submitCheckpoint` in `HarmonyLightClient.sol` needs to have called either for the next epoch or for a checkpoint, after the block the harmony mapping transaction was in.**
                * **NOTE: Automatic submission of checkpoints to the Harmony Light Client has not been developed as yet. (It is not part of the `ethRelay.js`). And so the checkpoint would need to be manually submitted before the Ethereum Mapping could take place.**
            * `require(spentReceipt[receiptHash] == false, "double spent!");` ensure that we haven't already processed this mapping request`
            * `HarmonyProver.verifyReceipt(header, receiptdata)` ensure the receiptdata is valid
            * `spentReceipt[receiptHash] = true;` marks the receipt as having been processed
            * `execute(receiptdata.expectedValue);` implemented by `TokenLocker.sol` which calls `onTokenMapAckEvent(topics)` implemented by `TokenRegistry.sol` 
                * `address tokenReq = address(uint160(uint256(topics[1])));`
                * `address tokenAck = address(uint160(uint256(topics[2])));`
                * `require(TxMapped[tokenReq] == address(0), "missing mapping to acknowledge");`
                * `TxMapped[tokenReq] = tokenAck;`
                * `TxMappedInv[tokenAck] = IERC20Upgradeable(tokenReq);`
                * `TxTokens.push(IERC20Upgradeable(tokenReq));`
5. Upon completion of tokenMap control is passed back to Bridge Map which
6. Calls TokenPair on Ethereum
7. Calls ethTokenInfo to get the status of the ERC20
8.  Calls hmyTokenInfo to get the tokenStatus on Harmony







