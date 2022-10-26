# Trustless Multichain Design

## Table of Contents

- [Trustless Multichain Design](#trustless-multichain-design)
  - [Table of Contents](#table-of-contents)
  - [Architecture](#architecture)
  - [Economics](#economics)
    - [Gas fees](#gas-fees)
      - [NEAR to Ethereum block propagation costing](#near-to-ethereum-block-propagation-costing)
    - [Bonding and Slashing](#bonding-and-slashing)
  - [Light Clients](#light-clients)
    - [Light Client Every Block Header (Ethereum to NEAR)](#light-client-every-block-header-ethereum-to-near)
    - [Light Client Merkle Mountain Range (NEAR to Ethereum)](#light-client-merkle-mountain-range-near-to-ethereum)
      - [NearOnEthClient Overview](#nearonethclient-overview)
      - [NEAR to Ethereum block propagation costing](#near-to-ethereum-block-propagation-costing-1)
  - [Relayers](#relayers)
    - [NEAR to Ethereum block propagation flow](#near-to-ethereum-block-propagation-flow)
    - [Ethereum to NEAR block propagation flow](#ethereum-to-near-block-propagation-flow)
  - [Watchdog/Fisherman/Verifiers](#watchdogfishermanverifiers)
    - [NEAR to Ethereum watchdog](#near-to-ethereum-watchdog)
  - [Signing Mechanisms](#signing-mechanisms)
  - [Communication Mechanisms](#communication-mechanisms)
  - [Message Formatting and Serialization](#message-formatting-and-serialization)
  - [Token Transfers](#token-transfers)
    - [Native Token Mapping](#native-token-mapping)
    - [ERC20 Token Mapping](#erc20-token-mapping)
    - [ERC20 Token Transfers](#erc20-token-transfers)
      - [Components](#components)
    - [ERC721 Token Transfers](#erc721-token-transfers)
  - [Data Transfer Layers](#data-transfer-layers)
- [APPENDICES](#appendices)
  - [APPENDIX A: Threat Mitigation](#appendix-a-threat-mitigation)
  - [APPENDIX B: Reference Cross Chain Communication Protocols](#appendix-b-reference-cross-chain-communication-protocols)
- [References](#references)


## Architecture



## Economics

### Gas fees

#### NEAR to Ethereum block propagation costing
The following links provide the production Ethereum addresses and blockexplorer views for NearBridge.sol and the ERC20 Locker
* [Ethereum Mainnet Bridge addresses and parameters](https://github.com/aurora-is-near/rainbow-bridge-client/tree/main/packages/client#ethereum-mainnet-bridge-addresses-and-parameters)
* [NearBridge.sol on Ethereum Block Explorer](https://etherscan.io/address/0x3fefc5a4b1c02f21cbc8d3613643ba0635b9a873)
    * [Sample `addLightClientBlock(bytes data)` function call](https://etherscan.io/tx/0xa0fbf1405747dbc1c1bda1227e46bc7c5feac36c0eeaab051022cfdb268e60cc/advanced)
* [NEAR ERC20Locker on Ethereum Block Explorer](https://etherscan.io/address/0x23ddd3e3692d1861ed57ede224608875809e127f#code)

At time of writing (Oct 26th, 2022). 
* NEAR Light Client Blocks are propogated every `4 hours`
* Sample Transaction fee `0.061600109576901025 Ether ($96.56)`
* Daily Transaction fees cost approximately `$600`
* *Note: Infrastructure costs for running relayer, watchdog, etc are not included.*

### Bonding and Slashing

* Relayers Bond 100 ETH
* Relayers Receive a reward of 0 ETH per block relayed
* Watchdog verifies each all the NEAR block producer signatures on each block and sends a challenge if signatures are invalid
* A succesful challenge results in a slashing of the Relayer who sent the block of 100 ETH, 50 ETH goes to the watchdog and the remaining 50 ETH is left in the Light Client Contract owned by the Administrator.

## Light Clients

### Light Client Every Block Header (Ethereum to NEAR)

At a high level the ethereum light client contract
* Optionally accepts client updates only from a trusted client
* Can pause functions
* Validates a sync committee exists for the curremt slot
* Validates sync committe has greater than the minimum required sync committee members
* Validates 2/3 or more of the committe members have signed the blocks
* Validates bls signatures (i.e. the bls signatures of the sync comittee for the blocks propogated)
* Stores the hashes of the blocks for the past `hashes_gc_threshold` headers.  Events that happen past this threshold cannot be verified by the client. It is desirable that this number is larger than 7 days' worth of headers, which is roughly 51k Ethereum blocks. So this number should be 51k in production.
* Stores the Ethereum Network (e.g. mainnet, kiln)
* Stores Hashes of the finalized execution blocks mapped to their numbers. 
* Stores All unfinalized execution blocks' headers hashes mapped to their `HeaderInfo`. 
* Stores `AccountId`s mapped to their number of submitted headers. 
* Stores Max number of unfinalized blocks allowed to be stored by one submitter account. This value should be at least 32 blocks (1 epoch), but the recommended value is 1024 (32 epochs)
* Stores minimum balance that should be attached to register a new submitter account.
* Stores finalized beacon header
* Stores finalized execution header
* Stores current_sync_committee
* Stores next_sync_committee

### Light Client Merkle Mountain Range (NEAR to Ethereum)

#### NearOnEthClient Overview

*The following is an excerpt from a blog by near on [eth-near-rainbow-bridge](https://near.org/blog/eth-near-rainbow-bridge/)*

> NearOnEthClient is an implementation of the NEAR light client in Solidity as an Ethereum contract. Unlike EthOnNearClient it does not need to verify every single NEAR header and can skip most of them as long as it verifies at least one header per NEAR epoch, which is about 43k blocks and lasts about half a day. As a result, NearOnEthClient can memorize hashes of all submitted NEAR headers in history, so if you are making a transfer from NEAR to Ethereum and it gets interrupted you don’t need to worry and you can resume it any time, even months later. Another useful property of the NEAR light client is that every NEAR header contains a root of the merkle tree computed from all headers before it. As a result, if you have one NEAR header you can efficiently verify any event that happened in any header before it.
> 
> Another useful property of the NEAR light client is that it only accepts final blocks, and final blocks cannot leave the canonical chain in NEAR. This means that NearOnEthClient does not need to worry about forks.
> 
> However, unfortunately, NEAR uses [Ed25519](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-665.md) to sign messages of the validators who approve the blocks, and this signature is not available as an EVM precompile. It makes verification of all signatures of a single NEAR header prohibitively expensive. So technically, we cannot verify one NEAR header within one contract call to NearOnEthClient. Therefore we adopt the [optimistic approach](https://medium.com/@deaneigenmann/optimistic-contracts-fb75efa7ca84) where NearOnEthClient verifies everything in the NEAR header except the signatures. Then anyone can challenge a signature in a submitted header within a 4-hour challenge window. The challenge requires verification of a single Ed25519 signature which would cost about 500k Ethereum gas (expensive, but possible). The user submitting the NEAR header would have to post a bond in Ethereum tokens, and a successful challenge would burn half of the bond and return the other half to the challenger. The bond should be large enough to pay for the gas even if the gas price increases exponentially during the 4 hours. For instance, a 20 ETH bond would cover gas price hikes up to 20000 Gwei. This optimistic approach requires having a watchdog service that monitors submitted NEAR headers and challenges any headers with invalid signatures. For added security, independent  users can run several watchdog services.
> 
> Once EIP665 is accepted, Ethereum will have the Ed25519 signature available as an EVM precompile. This will make watchdog services and the 4-hour challenge window unnecessary.
> 
> At its bare minimum, Rainbow Bridge consists of EthOnNearClient and NearOnEthClient contracts, and three services: Eth2NearRelay, Near2EthRelay, and the Watchdog. We might argue that this already constitutes a bridge since we have established a cryptographic link between two blockchains, but practically speaking it requires a large portion of additional code to make application developers even consider using the Rainbow Bridge for their applications.

*The following information on sending assets from NEAR back to Ethereum is an excerpt from [https://near.org/bridge/](https://near.org/bridge/).*

> Sending assets from NEAR back to Ethereum currently takes a maximum of sixteen hours (due to Ethereum finality times) and costs around $60 (due to ETH gas costs and at current ETH price). These costs and speeds will improve in the near future.

#### NEAR to Ethereum block propagation costing
The following links provide the production Ethereum addresses and blockexplorer views for NearBridge.sol and the ERC20 Locker
* [Ethereum Mainnet Bridge addresses and parameters](https://github.com/aurora-is-near/rainbow-bridge-client/tree/main/packages/client#ethereum-mainnet-bridge-addresses-and-parameters)
* [NearBridge.sol on Ethereum Block Explorer](https://etherscan.io/address/0x3fefc5a4b1c02f21cbc8d3613643ba0635b9a873)
    * [Sample `addLightClientBlock(bytes data)` function call](https://etherscan.io/tx/0xa0fbf1405747dbc1c1bda1227e46bc7c5feac36c0eeaab051022cfdb268e60cc/advanced)
* [NEAR ERC20Locker on Ethereum Block Explorer](https://etherscan.io/address/0x23ddd3e3692d1861ed57ede224608875809e127f#code)

At time of writing (Oct 26th, 2022). 
* NEAR Light Client Blocks are propogated every `4 hours`
* Sample Transaction fee `0.061600109576901025 Ether ($96.56)`
* Daily Transaction fees cost approximately `$600`
* *Note: Infrastructure costs for running relayer, watchdog, etc are not included.*

* [HarmonyMMR enhancements PR](https://github.com/harmony-one/harmony/pull/4198/files) 

## Relayers

### NEAR to Ethereum block propagation flow
[NEAR Light Client Documentation](https://nomicon.io/ChainSpec/LightClient) gives an overview of how light clients work. At a high level the light client needs to fetch at least one block per [epoch](https://docs.near.org/concepts/basics/epoch) i.e. every 42,200 blocks or approxmiately 12 hours. Also Having the LightClientBlockView for block B is sufficient to be able to verify any statement about state or outcomes in any block in the ancestry of B (including B itself).

The current scripts and codebase indicates that a block would be fetched every 30 seconds with a max delay of 10 seconds. It feels that this would be expensive to update Ethereum so frequently. [NEAR's bridge documentation](https://near.org/bridge/) states *Sending assets from NEAR back to Ethereum currently takes a maximum of sixteen hours (due to Ethereum finality times)*. This seems to align with sending light client updates once per NEAR epoch. The block fetch period is configurable in the relayer.

> The RPC returns the LightClientBlock for the block as far into the future from the last known hash as possible for the light client to still accept it. Specifically, it either returns the last final block of the next epoch, or the last final known block. If there's no newer final block than the one the light client knows about, the RPC returns an empty result.
>
> A standalone light client would bootstrap by requesting next blocks until it receives an empty result, and then periodically request the next light client block.
>
> A smart contract-based light client that enables a bridge to NEAR on a different blockchain naturally cannot request blocks itself. Instead external oracles query the next light client block from one of the full nodes, and submit it to the light client smart contract. The smart contract-based light client performs the same checks described above, so the oracle doesn't need to be trusted.

Block Submitters stake ETH to be allowed to submit blocks which get's slashed if the watchdog identifies blocks with invalid signatures.

*Note: Have not identified how the block submitters are rewarded for submitting blocks. Currently have only identified them locking ETH to be able to submit blocks and being slashed if they submit blocks with invalid signatures.*


* [Light Clients are deployed on Ethereum](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/index.js#L518) via the CLI using [eth-contracts.js](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/init/eth-contracts.js)
    * [init-eth-ed25519](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/index.js#L505): Deploys `Ed25519.sol` see more information under [nearbridge Cryptographic Primitives](#nearbridge-cryptographic-primitives)
    * [init-eth-client](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/index.js#L520): Deploys `NearBridge.sol` see more information under [NEAR to Ethereum block propagation components](#near-to-ethereum-block-propagation-components). It takes the following arguments
        * `ethEd25519Address`: The address of the ECDSA signature checker using Ed25519 curve (see [here](https://nbeguier.medium.com/a-real-world-comparison-of-the-ssh-key-algorithms-b26b0b31bfd9))
        * `lockEthAmount`: The amount that `BLOCK_PRODUCERS` need to deposit (in wei)to be able to provide blocks. This amount will be slashed if the block is challenged and proven not to have a valid signature. Default value is 100000000000000000000 WEI = 100 ETH.
        * `lockDuration` : 30 seconds
        * `replaceDuration`: 60 seconds it is passed in nanoseconds, because it is a difference between NEAR timestamps.
        * `ethAdminAddress`: Bridge Administrator Address
        * `0` : Indicates nothing is paused `UNPAUSE_ALL`
    * [init-eth-prover](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/index.js#L538): Deploys `NearProver.sol` see more information under [NEAR to Ethereum block propagation components](#near-to-ethereum-block-propagation-components). It takes the following arguments
        * `ethClientAddress`: Interface to `NearBridge.sol`
        * `ethAdminAddress`: Administrator address
        * `0`: paused indicator defaults to `UNPAUSE_ALL = 0`
* [Relayer is Started](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/commands/start/near2eth-relay.js)
    * Relayer is started using the following command
  
        ```
        cli/index.js start near2eth-relay \
        --eth-node-url http://127.0.0.1:8545/ \
        --eth-master-sk 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --near-node-url https://rpc.testnet.near.org/ \
        --near-network-id testnet \
        --eth-client-address 0xe7f1725e7734ce288f8367e1bb143e90bb3f0512 \
        --eth-use-eip-1559 true \
        --near2eth-relay-max-delay 10 \
        --near2eth-relay-block-select-duration 30 \
        --near2eth-relay-after-submit-delay-ms 1000 \
        --log-verbose true \
        --daemon false
        ```
* [Relayer Logic](https://github.com/aurora-is-near/rainbow-bridge/blob/master/near2eth/near2eth-block-relay/index.js)
    * Loops `while (true)`
        * Get the bridge state (including `currentHeight`, `nextTimestamp`, `nextValidAt`, `numBlockProducers` )
        * Get the `currentBlockHash` the hash of the current untrursted block based on `lastValidAt`
        * Gets the `lastBlock` by calling the NEAR rpc `next_light_client_block` using the hash of last untrusted block `bs58.encode(currentBlockHash)`
        * Get's the `replaceDuration` by `clientContract.methods.replaceDuration().call()` this will be 60 seconds if we deployed `NearBridge.sol` with the default values above
        * Sets `nextValidAt` from the bridge state `web3.utils.toBN(bridgeState.nextValidAt)`
        * Sets `replaceDelay` to 0 then updates it to the `nextTimestamp` + `replaceDuration` - `lastBlock.inner_lite.timestamp` i.e. The new block has to be at least 60 seconds after the current block stored on the light client.
        * Checks the height of the `currentHeight` of the bridge is less than the `lastblock` from the near light client `(bridgeState.currentHeight < lastBlock.inner_lite.height)`
        * Serializes the `lastBlock` using Borsh and check that the block is suitable
        * Checks that the `replaceDelay` has been met, if not sleeps until it has
        * Checks that the Master Account (the one submitting the block) has enough locked ETH (if not tries to deposit more). So that it can be slashed if the block proposed is invalid.
        * Adds the light client block `await clientContract.methods.addLightClientBlock(nextBlockSelection.borshBlock).send`
            * Checks `NearBridge.sol` (the light client) has been initialized
            * Checks `balanceOf[msg.sender] >= lockEthAmount` that the sender has locked enough Eth to allow them to submit blocks
            * Decodes the nearBlock using `Borsh.from(data)` and `borsh.decodeLightClientBlock()`
            * Commis the previous block, or make sure that it is OK to replace it using
                * `lastValidAt = 0;`
                * `blockHashes_[curHeight] = untrustedHash;`
                * `blockMerkleRoots_[curHeight] = untrustedMerkleRoot;`
            * Check that the new block's height is greater than the current one's. `nearBlock.inner_lite.height > curHeight`
            * Check that the new block is from the same epoch as the current one, or from the next one.
            * Check that the new block is signed by more than 2/3 of the validators.
            * If the block is from the next epoch, make sure that the Block producers `next_bps` are supplied and have a correct hash.
            * Add the Block to the Light client
                * Updates untrusted information to this block including `untrustedHeight`, `untrustedTimestamp`, `untrustedHash`, `untrustedMerkleRoot`, `untrustedNextHash`, `untrustedSignatureSet`, `untrustedNextEpoch`
                * If `fromNextEpoch` also update the Block Producers
                * Updates the `lastSubmitter` and `lastValidAt`
        * Cleans up the selected block to prevent submitting the same block again `await sleep(afterSubmitDelayMs)`
        * Sets the HeightGauuges to the correct block height
            * `clientHeightGauge.set(Number(BigInt(bridgeState.currentHeight))`
            * `chainHeightGauge.set(Number(BigInt(lastBlock.inner_lite.height)))`
        * Sleeps for delay calculated from the maximum of the relayer days (10 seconds) and differnce between the current and next block time stamps and `await sleep(1000 * delay)`

### Ethereum to NEAR block propagation flow

* [Light Clients are deployed on Near](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs#L107): 
    * [init_contract](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs#L107): The eth2near relayer is called with an argument to initialize the [eth2-client contract](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/src/lib.rs)
        * [eth_client_contract](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs#L108): is created using a contract_wrapper
            * `let mut eth_client_contract = EthClientContract::new(get_eth_contract_wrapper(&config));`
       * [EthClientContract Wrapper](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/contract_wrapper/src/eth_client_contract.rs): creates an instance of [eth2-client contract](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/src/lib.rs)  with the following arguments
            * `network` - the name of Ethereum network such as `mainnet`, `goerli`, `kiln`, etc.
            * `finalized_execution_header` - the finalized execution header to start initialization with.
            * `finalized_beacon_header` - correspondent finalized beacon header.
            * `current_sync_committee` - sync committee correspondent for finalized block.
            * `next_sync_committee` - sync committee for the next period after period for finalized block.
            * `hashes_gs_threshold` - the maximum number of stored finalized blocks.
            * `max_submitted_block_by_account` - the maximum number of unfinalized blocks which one relay can store in the client's storage.
            * `trusted_signer` - the account address of the trusted signer which is allowed to submit light client updates.
* [Relayer is Created](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs#L111):
    * [eth2near_relay](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs#L111) is created using the following arguments
        * `let mut eth2near_relay = Eth2NearRelay::init(&config, get_eth_client_contract(&config), args.enable_binary_search, args.submit_only_finalized_blocks,);`
* [Relayer is Started](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs):
    * The relayer is started using `eth2near_relay.run(None);`
    * This executes the [eth2near_relay run function](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth2near_relay.rs#L257) `pub fn run(&mut self, max_iterations: Option<u64>)` which runs until terminated doing using the following loop `while !self.terminate`
        * `self.wait_for_synchronization(),`: gets the sync status
        * `sleep(Duration::from_secs(12));`: waits for 12 seconds
        * `self.get_max_slot_for_submission()`: gets the maximum slot for submission from Ethereum
        * `self.get_last_eth2_slot_on_near`: gets the latest slot propogated from Ethereum to NEAR
        * `if last_eth2_slot_on_near < max_slot_for_submission`: If there are slots to process
            * `self.get_execution_blocks_between(last_eth2_slot_on_near + 1, max_slot_for_submission,),`: Get the execution blocks to be processed
            * `self.submit_execution_blocks(headers, current_slot, &mut last_eth2_slot_on_near)`: submit them
            * `were_submission_on_iter = true;`: flags that there were submissions
        * `were_submission_on_iter |= self.send_light_client_updates_with_checks(last_eth2_slot_on_near);`: send light_client updates with checks and updates the submission flag to true if if passes. Following is some key logic 
            * `self.is_enough_blocks_for_light_client_update`: Checks if there are enough blocks for a light client update
              * `self.send_light_client_updates` calls `send_light_client_update` which
                  * `if last_finalized_slot_on_eth >= last_finalized_slot_on_near + self.max_blocks_for_finalization`: checks if the gap is too big (i.e. we are at a new slot) between slot of finalized block on NEAR and ETH. If it is it sends a hand made client update (which will loop getting the new slots sync committees) otherwise it sends a regular client update (which propogates the block headers)
                      * `self.send_hand_made_light_client_update(last_finalized_slot_on_near);`
                          * `let include_next_sync_committee = BeaconRPCClient::get_period_for_slot (last_finalized_slot_on_near) != BeaconRPCClient::get_period_for_slot(attested_slot);`
                      * `self.send_regular_light_client_update(last_finalized_slot_on_eth, last_finalized_slot_on_near,);`
                  * `self.send_specific_light_client_update(light_client_update)` is called for both regular and hand made updates. 
                      * `self.eth_client_contract.is_known_block`: Checks if the block is already known on the Etherum Client Contract on NEAR
                      * `self.verify_bls_signature_for_finality_update(&light_client_update)`: Verifies the BLS signatures. This calls `is_correct_finality_update` in `eth2near/finality-update-verify/src/lib.rs`
                          * 
                      * `self.eth_client_contract.send_light_client_update(light_client_update.clone())`: Updates the light client with the finalized block
                      * `self.beacon_rpc_client.get_block_number_for_slot(types::Slot::new(light_client_update.finality_update.header_update.beacon_header.slot.as_u64())),`: Validates Finalized block number is correct on Ethereum usng the `beacon_rpc_client`.
                      * `sleep(Duration::from_secs(self.sleep_time_after_submission_secs));`: sleeps for the configured submission sleep time.
        * `if !were_submission_on_iter {thread::sleep(Duration::from_secs(self.sleep_time_on_sync_secs));}`: if there were submissions sleep for however many seconds were configured for sync sleep time.



## Watchdog/Fisherman/Verifiers

### NEAR to Ethereum watchdog
The [watchdog](https://github.com/aurora-is-near/rainbow-bridge/blob/master/near2eth/watchdog/index.js) runs every 10 seconds and validates blocks on `NearBridge.sol` challenging blocks with incorrect signatures. *Note: It uses [heep-prometheus](https://github.com/aurora-is-near/rainbow-bridge/blob/master/utils/http-prometheus.js) for monitoring and storing block and producer information using `gauges` and `counters`.*

* [watchdog is started](https://github.com/aurora-is-near/rainbow-bridge/blob/master/cli/commands/start/watchdog.js) from the CLI
* [watchdog logic](https://github.com/aurora-is-near/rainbow-bridge/blob/master/near2eth/watchdog/index.js)
    * Initializes monitoring information on `Prometheus`
        * `const httpPrometheus = new HttpPrometheus(this.metricsPort, 'near_bridge_watchdog_')`
        * `const lastBlockVerified = httpPrometheus.gauge('last_block_verified', 'last block that was already verified')`
        * `const totBlockProducers = httpPrometheus.gauge('block_producers', 'number of block producers for current block')`
        * `const incorrectBlocks = httpPrometheus.counter('incorrect_blocks', 'number of incorrect blocks found')`
        * `const challengesSubmitted = httpPrometheus.counter('challenges_submitted', 'number of blocks challenged')`
    * Loops `while (true) `
        * Gets the `bridgeState`
        * Loops through all blockProducers checking their signatures
        * `for (let i = 0; i < numBlockProducers; i++)`
            * Check each signature `this.clientContract.methods.checkBlockProducerSignatureInHead(i).call()`
            * If invalid challenge the signature: `this.clientContract.methods.challenge(this.ethMasterAccount, i).encodeABI()` calls [challenge function](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/NearBridge.sol#L93)
                * `function challenge(address payable receiver, uint signatureIndex) external override pausable(PAUSED_CHALLENGE)`
                    * checks block.timestamp is less than lastValidAt `block.timestamp < lastValidAt,`
                    * Check if the signature is valid `!checkBlockProducerSignatureInHead(signatureIndex)`
                    * slashes the last submitter `balanceOf[lastSubmitter] = balanceOf[lastSubmitter] - lockEthAmount;`
                    * resets lastValidAt `lastValidAt = 0;`
                    * Refunds half of the funds to the watchdog account `receiver.call{value: lockEthAmount / 2}("");`
            * Sleeps for watchdog Delay seconds `await sleep(watchdogDelay * 1000)`

## Signing Mechanisms

[ECDSA](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm): Elliptic Curve Digital Signature Algorithm (ECDSA)

- ECDSA (on secp256k1)

[EdDSA](https://en.wikipedia.org/wiki/EdDSA): Edwards-curve Digital Signature Algorithm (EdDSA)

- [Ed25519](https://en.wikipedia.org/wiki/EdDSA): [Ed25519.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/Ed25519.sol)

[BLS](https://en.wikipedia.org/wiki/BLS_digital_signature): Boneh–Lynn–Shacham

- [BLS Signatures in Solidity](https://hackmd.io/@liangcc/bls-solidity)
- [BLS12-381 For The Rest Of Us](https://hackmd.io/@benjaminion/bls12-381)
- [EIP-2537: Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
    - [Targeting Shanghai upgrade May 2023](https://ethereum-magicians.org/t/eip-2537-bls12-precompile-discussion-thread/4187/16)
    - [Shanghai Core EIP Consideration](https://ethereum-magicians.org/t/shanghai-core-eip-consideration/10777/26)
- [BLS12-381](https://hackmd.io/@benjaminion/bls12-381)
- [bn128](https://aztecprotocol.github.io/aztec-crypto-js/module-bn128.html)
    - [EIP-1108: Reduce alt_bn128 precompile gas costs](https://aztecprotocol.github.io/aztec-crypto-js/module-bn128.html)
    - [BN254](https://neuromancer.sk/std/bn/bn254)
    - [EIP-2494: Baby Jubjub Elliptic Curve an elliptic curve designed to work inside zk-SNARK circuits in Ethereum.](https://eips.ethereum.org/EIPS/eip-2494)

## Communication Mechanisms
[Networking](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/p2p-interface.md) vs [RPC](https://ethereum.github.io/beacon-APIs/)



## Message Formatting and Serialization

* [(RLP) Serialization](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp/)*

* [SSZ: Simple Serialize](https://ethereum.org/en/developers/docs/data-structures-and-encoding/ssz/): Overview of Simple serialize (SSZ) is the serialization method used on the Beacon Chain. (including merkalization and multiproofs)

* [borsh](https://borsh.io/) 

## Token Transfers

### Native Token Mapping

### ERC20 Token Mapping

### ERC20 Token Transfers

#### Components

TokenLocker

TransactionVerifier

Transaction Processor

### ERC721 Token Transfers

## Data Transfer Layers

# APPENDICES

## APPENDIX A: Threat Mitigation

Following is an overview of some common bridge attack vectors.

* [Vitalik; security limits of bridges](https://old.reddit.com/r/ethereum/comments/rwojtk/ama_we_are_the_efs_research_team_pt_7_07_january/hrngyk8/)

> Now, imagine what happens if you move 100 ETH onto a bridge on Solana to get 100 Solana-WETH, and then Ethereum gets 51% attacked. The attacker deposited a bunch of their own ETH into Solana-WETH and then reverted that transaction on the Ethereum side as soon as the Solana side confirmed it. The Solana-WETH contract is now no longer fully backed, and perhaps your 100 Solana-WETH is now only worth 60 ETH. Even if there's a perfect ZK-SNARK-based bridge that fully validates consensus, it's still vulnerable to theft through 51% attacks like this.
>
> It's always safer to hold Ethereum-native assets on Ethereum or Solana-native assets on Solana than it is to hold Ethereum-native assets on Solana or Solana-native assets on Ethereum. And in this context, "Ethereum" refers not just to the base chain, but also any proper L2 that is built on it. If Ethereum gets 51% attacked and reverts, Arbitrum and Optimism revert too, and so "cross-rollup" applications that hold state on Arbitrum and Optimism are guaranteed to remain consistent even if Ethereum gets 51% attacked. And if Ethereum does not get 51% attacked, there's no way to 51% attack Arbitrum and Optimism separately. Hence, holding assets issued on Optimism wrapped on Arbitrum is still perfectly safe.
>
> Why a rollup can't just "go use another data layer". If a rollup stores its data on Celestia or BCH or whatever else but deals with assets on Ethereum, if that layer gets 51% attacked you're screwed. The DAS on Celestia providing 51% attack resistance doesn't actually help you because the Ethereum network isn't reading that DAS; it would be reading a bridge, which would be vulnerable to 51% attacks. To be a rollup that provides security to applications using Ethereum-native assets, you have to use the Ethereum data layer (and likewise for any other ecosystem).


Here are some sample hacks

* [Vulnerabilities in Cross-chain Bridge Protocols Emerge as Top Security Risk](https://blog.chainalysis.com/reports/cross-chain-bridge-hacks-2022/)

> Following last night’s exploit of the Nomad Bridge, Chainalysis estimates that $2 billion in cryptocurrency has been stolen across 13 separate cross-chain bridge hacks, the majority of which was stolen this year. Attacks on bridges account for 69% of total funds stolen in 2022 so far. 

* [EXPLAINED: THE QUBIT HACK (JANUARY 2022)](https://halborn.com/explained-the-qubit-hack-january-2022/)

> The exploited contract used a modified safeTransferFrom() function which instead of making use of functionCall() to verify that the target address contained contract code, used the call() function directly. As the 0 address has no code at all, no code is run, and the call is completed successfully without reverting. As a result, the deposit function executed successfully but no real tokens were deposited.
> 
> The Ethereum QBridge caught the Deposit event and interpreted it as a valid deposit of ETH.  As a result, qXETH tokens were minted for the attacker on BSC.

* [EXPLAINED: THE WORMHOLE HACK (FEBRUARY 2022)](https://halborn.com/explained-the-wormhole-hack-february-2022/)

> The actual extraction of 120k ETH from the Wormhole bridge came at the end of a series of events.  The actual flow of the attack was:
>
> 1. The attacker creates a validator action approval (VAA) with a call to post_vaa
> 2. This VAA was used in a call to complete_wrapped to mint the 120,000 ETH extracted in the attack
> 3. The attacker “legitimately” extracted the minted tokens from the bridge
>
> The vulnerability that made the attack possible was a failure to perform proper signature verification in the VAA creation process.  The role of signature verification is delegated several times from post_vaa to verify_signatures to Secp256k1.
* [EXPLAINED: THE RONIN HACK (MARCH 2022)](https://halborn.com/explained-the-ronin-hack-march-2022/)
> The Ronin Network attack was extremely stealthy.  In fact, the hack wasn’t noticed until six days after it occurred when the project team was notified by a user that they couldn’t withdraw about 5k ETH from the project’s bridge.  Further investigation discovered the largest hack in DeFi history to date.
> 
> The Ronin Network hack was made possible by compromised private keys.  The Ronin Network uses a set of nine validator nodes to approve transactions on the bridge, and a deposit or withdrawal requires approval by a majority of five of these nodes.  The attacker gained control of four validators controlled by Sky Mavis and a third-party Axie DAO validator that signed their malicious transactions.

* [EXPLAINED: THE HARMONY HORIZON BRIDGE HACK](https://halborn.com/explained-the-harmony-horizon-bridge-hack/)
> Like most cross-chain bridges, the Harmony Horizon Bridge has a validation process for approving transactions being transferred over the bridge.  In this case, the approvals process uses a multi-signature scheme with five validators.
> 
> However, the bridge only used a 2 of 5 validation scheme.  This means that only two blockchain accounts needed to be compromised for an attacker to approve any malicious transaction that they wished.
> 
> The Harmony Horizon bridge was exploited via the theft of two private keys.  These private keys were encrypted with both a passphrase and a key management service, and no system had access to multiple plaintext keys.  However, the attacker managed to access and decrypt multiple keys.
> 
> With access to two of the bridge’s private keys, the attacker could create a transaction extracting $100 million from the bridge and confirm it using two accounts under their control.

* [THE NOMAD BRIDGE HACK: A DEEPER DIVE](https://halborn.com/the-nomad-bridge-hack-a-deeper-dive/)

> On August 1, DeFi bridge Nomad was hacked for over $190M.
>
> After a frenzied hack from hundreds of wallets, the bridge’s TVL dropped from $190,740,000 to $1,794 in mere hours. The hack involved a total of 960 transactions with 1,175 individual withdrawals from the bridge.
According to Nomad’s post-mortem, an implementation bug in a June 21 smart contract upgrade caused the Replica contract to fail to authenticate messages properly.  This issue meant that any message could be forged as long as it had not already been processed.   
>
> As a result, contracts relying on the Replica for authentication of inbound messages suffered security failures.  From there, this authentication failure resulted in fraudulent messages being passed to the Nomad BridgeRouter contract. 

## APPENDIX B: Reference Cross Chain Communication Protocols


- [INTER‑BLOCKCHAINCOMMUNICATION PROTOCOL](https://ibcprotocol.org/)
- [Cosmos IBC: Interchain Standards](https://github.com/cosmos/ibc)
- [IBC Update— The Internet of Blockchains Is Growing Fast](https://blog.cosmos.network/ibc-update-the-internet-of-blockchains-is-growing-fast-dae883228ebf)
- [Polkadot Cross-Consensus Message (XCM) Format](https://github.com/paritytech/xcm-format/blob/master/README.md)
- [XCMP Design](https://research.web3.foundation/en/latest/polkadot/XCMP/index.html)
- [HRMP Channels](https://research.web3.foundation/en/latest/polkadot/XCMP/HRMP%20channels.html)
- [The Path of a Parachain Block](https://polkadot.network/blog/the-path-of-a-parachain-block/)
- [Parity Bridges Common](https://github.com/paritytech/parity-bridges-common/blob/master/README.md)

# References
- [ETHEREUM DEVELOPMENT DOCUMENTATION](https://ethereum.org/en/developers/docs/)
- [Elliptic Curve Cryptography: a gentle introduction](https://andrea.corbellini.name/2015/05/17/elliptic-curve-cryptography-a-gentle-introduction/)
- [Exploring Elliptic Curve Pairings](https://vitalik.ca/general/2017/01/14/exploring_ecp.html)
- [KZG polynomial commitments](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
- [Bridging the Multichain Universe with Zero Knowledge Proofs](https://medium.com/@ingonyama/bridging-the-multichain-universe-with-zero-knowledge-proofs-6157464fbc86)
- [Harmony’s Cross-Chain Future](https://medium.com/harmony-one/harmonys-cross-chain-future-41d02d53b10)
- [zkBridge: Trustless Cross-chain Bridges Made Practical](https://rdi.berkeley.edu/zkp/zkBridge/uploads/paper.pdf)
- [Succinct Towards the endgame of blockchain interoperability with proof of consensus](https://blog.succinct.xyz/post/2022/09/20/proof-of-consensus)
- [zkBridge: Trustless Cross-chain Bridges Made Practical](https://rdi.berkeley.edu/zkp/zkBridge/zkBridge.html)
- [awesome-zkml](https://github.com/worldcoin/awesome-zkml)
- [Vitalik: why the future will be *multi-chain*, but it will not be *cross-chain*](https://twitter.com/vitalikbuterin/status/1479501366192132099?lang=en)
- [Vitalik’s Annotated Ethereum 2.0 Spec](https://notes.ethereum.org/@vbuterin/SkeyEI3xv)
- [MINA docs](https://docs.minaprotocol.com/)
- [nil-Foundation ETH-Mina bridge live on Ethereum testnet Ropsten](https://minacrypto.com/2022/04/27/nil-foundation/)
- [Wormhole ethereum contracts Implementaion.sol](https://github.com/wormhole-foundation/wormhole/blob/dev.v2/ethereum/contracts/Implementation.sol)
- [bls verification contract](https://github.com/semaraugusto/bls-verification-contract/blob/master/contracts/verifier.sol)
- [isomorph signing issues](https://github.com/isolab-gg/isomorph/issues)
- [Caulk: Lookup Arguments in Sublinear Time](https://eprint.iacr.org/2022/621.pdf)
- [HyperPlonk: Plonk with Linear-Time Prover and High-Degree Custom Gates](https://eprint.iacr.org/2022/1355.pdf)
- [PLONK-style SNARKs without FFTs](https://notes.ethereum.org/DLRqK9V7RIOsTZkab8Hm_Q?view)