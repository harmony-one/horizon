# Ethereum 2.0 Support

The current design needs to be updated for ETH 2.0. This involves removing the ETHHASH logic and SPV client and potentially replacing with MMR trees per epoch and checkpoints similar to Harmony Light Client on Ethereum. 


Below are some reference material and a review of Harmony MMR trees and the Near Rainbow Bridge implementation which interacts with the Ethereum 2.0 beacon chain for proof of finality.


## Ethereum 2.0 Specifications

* [Beacon Chain Specification](https://github.com/ethereum/consensus-specs/blob/master/specs/phase0/beacon-chain.md)
* [Extended light client protocol](https://notes.ethereum.org/@vbuterin/extended_light_client_protocol)
* [Altair Light Client -- Light Client](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md)
* [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md)
* [Beacon Chain Fork Choice](https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/fork-choice.md)


## Ethereum 2.0 Light Client Support
How light client implementation and verification of ETH and ETH2 can be done via smart contracts in other protocols.

For this we review three Key items

1. Light Client Specifications including [Extended light client protocol](https://notes.ethereum.org/@vbuterin/extended_light_client_protocol) described by [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md) and the [The Portal Network Specification](https://github.com/ethereum/portal-network-specs)
2. Near Rainbow Bridge Light Client Walkthrough include [eth2near-block-relay-rs](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/eth2near-block-relay-rs), [nearbridge contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearbridge) and [nearprover contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearprover)
3. Prysm light-client [prototype](https://github.com/jinfwhuang/prysm/tree/jin-light/cmd/light-client)

*Note: Time on Ethereum 2.0 Proof of Stake is divided into slots and epochs. One slot is 12 seconds. One epoch is 6.4 minutes, consisting of 32 slots. One block can be created for each slot.*
### Light Client Specification

#### Altair Light Client -- Sync Protocol
* [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md): The beacon chain is designed to be light client friendly for constrained environments to access Ethereum with reasonable safety and liveness.

    Such environments include resource-constrained devices (e.g. phones for trust-minimized wallets)and metered VMs (e.g. blockchain VMs for cross-chain bridges).

    This document suggests a minimal light client design for the beacon chain thatuses sync committees introduced in [this beacon chain extension](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/beacon-chain.md).

    Additional documents describe how the light client sync protocol can be used:
    - [Full node](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/full-node.md)
    - [Light client](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md)
    - [Networking](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/p2p-interface.md)

* [Light client sync process](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md): explains how light clients MAY obtain light client data to sync with the network.

    1. The light client MUST be configured out-of-band with a spec/preset (including fork schedule), with `genesis_state` (including `genesis_time` and `genesis_validators_root`), and with a trusted block root. The trusted block SHOULD be within the weak subjectivity period, and its root SHOULD be from a finalized `Checkpoint`.
    2. The local clock is initialized based on the configured `genesis_time`, and the current fork digest is determined to browse for and connect to relevant light client data providers.
    3. The light client fetches a [`LightClientBootstrap`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md) object for the configured trusted block root. The `bootstrap` object is passed to [`initialize_light_client_store`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#initialize_light_client_store) to obtain a local [`LightClientStore`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#lightclientstore).
    4. The light client tracks the sync committee periods `finalized_period` from `store.finalized_header.slot`, `optimistic_period` from `store.optimistic_header.slot`, and `current_period` from `current_slot` based on the local clock.
        1. When `finalized_period == optimistic_period` and [`is_next_sync_committee_known`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#is_next_sync_committee_known) indicates `False`, the light client fetches a [`LightClientUpdate`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#lightclientupdate) for `finalized_period`. If `finalized_period == current_period`, this fetch SHOULD be scheduled at a random time before `current_period` advances.
        2. When `finalized_period + 1 < current_period`, the light client fetches a `LightClientUpdate` for each sync committee period in range `[finalized_period + 1, current_period)` (current period excluded)
        3. When `finalized_period + 1 >= current_period`, the light client keeps observing [`LightClientFinalityUpdate`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#lightclientfinalityupdate) and [`LightClientOptimisticUpdate`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#lightclientoptimisticupdate). Received objects are passed to [`process_light_client_finality_update`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#process_light_client_finality_update) and [`process_light_client_optimistic_update`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#process_light_client_optimistic_update). This ensures that `finalized_header` and `optimistic_header` reflect the latest blocks.
    5. [`process_light_client_store_force_update`](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md#process_light_client_store_force_update) MAY be called based on use case dependent heuristics if light client sync appears stuck. If available, falling back to an alternative syncing mechanism to cover the affected sync committee period is preferred.


#### The Portal Network
* [The Portal Network](https://github.com/ethereum/portal-network-specs): The Portal Network is an in progess effort to enable lightweight protocol access by resource constrained devices.  The term *"portal"* is used to indicate that these networks provide a *view* into the protocol but are not critical to the operation of the core Ethereum protocol.

    The Portal Network is comprised of multiple peer-to-peer networks which together provide the data and functionality necessary to expose the standard [JSON-RPC API](https://eth.wiki/json-rpc/API).  These networks are specially designed to ensure that clients participating in these networks can do so with minimal expenditure of networking bandwidth, CPU, RAM, and HDD resources.

    The term 'Portal Client' describes a piece of software which participates in these networks. Portal Clients typically expose the standard JSON-RPC API.


    * Motivation: The Portal Network is focused on delivering reliable, lightweight, and decentralized access to the Ethereum protocol.

    * Prior Work on the "Light Ethereum Subprotocol" (LES): The term "light client" has historically refered to a client of the existing [DevP2P](https://github.com/ethereum/devp2p/blob/master/rlpx.md) based [LES](https://github.com/ethereum/devp2p/blob/master/caps/les.md) network.  This network is designed using a client/server architecture.  The LES network has a total capacity dictated by the number of "servers" on the network.  In order for this network to scale, the "server" capacity has to increase.  This also means that at any point in time the network has some total capacity which if exceeded will cause service degradation across the network.  Because of this the LES network is unreliable when operating near capacity.


* Block Relay
    * [Beacon State](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/beacon-state-network.md#dht-overview): A client has a trusted beacon state root, and it wants to access some parts of the state. Each of the access request corresponds to some leave nodes of the beacon state. The request is a content lookup on a DHT. The response is a Merkle proof.

        A Distributed Hash Table (DHT) allows network participants to have retrieve data on-demand based on a content 
    * [Syncing Block Headers](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/sync-gossip.md): A beacon chain client could sync committee to perform state updates. The data object LightClientSkipSyncUpdate allows a client to quickly sync to a recent header with the appropriate sync committee. Once the client establishes a recent header, it could sync to other headers by processing LightClientUpdates. These two data types allow a client to stay up-to-date with the beacon chain.
         * [Sync State](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/skip-sync-network.md): A client uses SkipSyncUpdate to skip sync from a known header to a recent header. A client with a trusted but outdated header cannot use the messages in the gossip channel bc-light-client-update to update. The client's sync-committee in the stored snapshot is too old and not connected to any update messages. The client look for the appropriate SkipSyncUpdate to skip sync its header.
        * [Advance Block Headers](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/sync-gossip.md): A beacon chain client could sync committee to perform [state updates](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/sync-protocol.md). The data object [LightClientSkipSyncUpdate](skip-sync-network) allows a client to quickly sync to a recent header with the appropriate sync committee. Once the client establishes a recent header, it could sync to other headers by processing [LightClientUpdates](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/sync-protocol.md#lightclientupdate). These two data types allow a client to stay up-to-date with the beacon chain.

            These two data types are placed into separate sub-networks. A light client make find-content requests on `skip-sync-network` at start of the sync to get a header with the same `SyncCommittee` object as in the current sync period. The client uses messages in the gossip topic `bc-light-client-update` to advance its header.

            The gossip topics described in this document is part of a [proposal](https://ethresear.ch/t/a-beacon-chain-light-client-proposal/11064) for a beacon chain light client.

#### Transaction Proofs
* [Retrieving Beacon State](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/beacon-state-network.md): A client has a trusted beacon state root, and it wants to access some parts of the state. Each of the access request corresponds to some leave nodes of the beacon state. The request is a content lookup on a DHT. The response is a Merkle proof.

    A Distributed Hash Table (DHT) allows network participants to have retrieve data on-demand based on a content key. A portal-network DHT is different than a traditional one in that each participant could selectively limit its workload by choosing a small interest radius r. A participants only process messages that are within its chosen radius boundary.
    * [Wire Protocol](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/beacon-state-network.md#wire-protocol): For a subprotocol, we need to further define the following to be able to instantiate the wire format of each message type.
        1. `content_key`
        2. `content_id` 
        3. `payload`

        The content of the message is a Merkle proof contains multiple leave nodes for a [BeaconState](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/beacon-chain.md#beaconstate).

        Finally, we define the necessary encodings. A light client only knows the root of the beacon state. The client wants to know the details of some leave nodes. The client has to be able to construct the `content_key` only knowing the root and which leave nodes it wants see. The `content_key` is the ssz serialization of the paths. The paths represent the part of the beacon state that one wants to know about. The paths are represented by generalized indices. Note that `hash_tree_root` and `serialize` are the same as those defined in [sync-gossip](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/sync-gossip.md). 
    
* TODO: Review of Retrieving a transaction proof not just retrieving data on-demand

### References
* Ethereum 2.0 Specifications
    * [Beacon Chain Specification](https://github.com/ethereum/consensus-specs/blob/master/specs/phase0/beacon-chain.md)
    * [Extended light client protocol](https://notes.ethereum.org/@vbuterin/extended_light_client_protocol)
    * [Altair Light Client -- Light Client](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/light-client.md)
    * [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md)
    * [Beacon Chain Fork Choice](https://github.com/ethereum/consensus-specs/blob/dev/specs/phase0/fork-choice.md)
    * [The Portal Network Specification](https://github.com/ethereum/portal-network-specs): an in progess effort to enable lightweight protocol access by resource constrained devices.
* [Light Ethereum Subprotocol (LES)](https://github.com/ethereum/devp2p/blob/master/caps/les.md): the protocol used by "light" clients, which only download block headers as they appear and fetch other parts of the blockchain on-demand. 
* [BlockDaemon: Ethereum Altair Hard Folk: Light Clients & Sync Committees](https://blockdaemon.com/blog/ethereum-altair-hard-folk-light-clients-sync-committees/)
* [Efficient algorithms for CBC Casper](https://docs.google.com/presentation/d/1oc_zdywOsHxz3zez1ILAgrerS7RkaF1hHoW0FLtp0Gw/edit#slide=id.p): Review of LMD GHOST (Latest Message Driven, Greediest Heaviest Observed Sub-Tree)
* [SSZ: Simple Serialize](https://ethereum.org/en/developers/docs/data-structures-and-encoding/ssz/): Overview of Simple serialize (SSZ) is the serialization method used on the Beacon Chain. (including merkalization and multiproofs)
* [The Noise Protocol Framework](https://noiseprotocol.org/noise.html): Noise is a framework for crypto protocols based on Diffie-Hellman key agreement. 
* [Flashbots for Ethereum Consensus Clients](https://hackmd.io/QoLwVQf3QK6EiVt15YOYqQ?view)
* [Optimistic Sync Specification](https://github.com/ethereum/consensus-specs/blob/dev/sync/optimistic.md): Optimistic Sync is a stop-gap measure to allow execution nodes to sync via established methods until future Ethereum roadmap items are implemented (e.g., statelessness).
* [Consensus Light Client Server Implementation Notes](https://hackmd.io/hsCz1G3BTyiwwJtjT4pe2Q?view): How  Lodestar beacon node was tweaked to serve light clients
* [beacon chain light client design doc](https://notes.ethereum.org/@ralexstokes/HJxDMi8vY): notes about the design/implementation of a beacon chain light client using standard APIs and protocol features 
* [A Beacon Chain Light Client Proposal](https://ethresear.ch/t/a-beacon-chain-light-client-proposal/11064): proposing a light client implementation that goes a step further than the minimum light client described in the altair consensus-spec. The proposed client aims to allow queries into the beacon state.
* [Distributed Hash Table (DHT) Overview](https://github.com/ethereum/portal-network-specs/blob/master/beacon-chain/beacon-state-network.md#dht-overview): allows network participants to have retrieve data on-demand based on a content key.
* [(WIP) Light client p2p interface Specification](https://github.com/ethereum/consensus-specs/pull/2786): a PR to get the conversation going about a p2p approach.

### Near Rainbow Bridge Light Client Walkthrough
The following is a walkthrough of how a transaction executed on Ethereum is propogated to NEAR's [eth2-client](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near/eth2-client). See [Cryptographic Primitives](#cryptographic-primitives) for more information on the cryptography used.


**At a high level the ethereum light client contract**
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

#### Ethereum to NEAR block propogation flow

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

#### Ethereum to NEAR block propogration components

* [EthClientContract Wrapper](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/contract_wrapper/src/eth_client_contract.rs): supports [eth2-client contract](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/src/lib.rs) functions `impl EthClientContractTrait for EthClientContract `
    * `fn get_last_submitted_slot(&self) -> u64`
    * `fn is_known_block(&self, execution_block_hash: &H256) -> Result<bool, Box<dyn Error>>`
    * `fn send_light_client_update(&mut self, light_client_update: LightClientUpdate,) -> Result<FinalExecutionOutcomeView, Box<dyn Error>>`
    * `fn get_finalized_beacon_block_hash(&self) -> Result<H256, Box<dyn Error>> `
    * `fn get_finalized_beacon_block_slot(&self) -> Result<u64, Box<dyn Error>>`
    * `fn send_headers(&mut self, headers: &[BlockHeader], end_slot: u64,) -> Result<FinalExecutionOutcomeView, Box<dyn std::error::Error>> `
    * `fn get_min_deposit(&self) -> Result<Balance, Box<dyn Error>>`
    * `fn register_submitter(&self) -> Result<FinalExecutionOutcomeView, Box<dyn Error>>`
    * `fn is_submitter_registered(&self,account_id: Option<AccountId>,) -> Result<bool, Box<dyn Error>>`
    * `fn get_light_client_state(&self) -> Result<LightClientState, Box<dyn Error>> `
    * `fn get_num_of_submitted_blocks_by_account(&self) -> Result<u32, Box<dyn Error>> `
    * `fn get_max_submitted_blocks_by_account(&self) -> Result<u32, Box<dyn Error>>`
* [eth2-client contract storage](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/src/lib.rs): 
    * High level storage overview
    * provides the `Eth2Client` public data stucture

    ```
    pub struct Eth2Client {
        /// If set, only light client updates by the trusted signer will be accepted
        trusted_signer: Option<AccountId>,
        /// Mask determining all paused functions
        paused: Mask,
        /// Whether the client validates the updates.
        /// Should only be set to `false` for debugging, testing, and diagnostic purposes
        validate_updates: bool,
        /// Whether the client verifies BLS signatures.
        verify_bls_signatures: bool,
        /// We store the hashes of the blocks for the past `hashes_gc_threshold` headers.
        /// Events that happen past this threshold cannot be verified by the client.
        /// It is desirable that this number is larger than 7 days' worth of headers, which is roughly
        /// 51k Ethereum blocks. So this number should be 51k in production.
        hashes_gc_threshold: u64,
        /// Network. e.g. mainnet, kiln
        network: Network,
        /// Hashes of the finalized execution blocks mapped to their numbers. Stores up to `hashes_gc_threshold` entries.
        /// Execution block number -> execution block hash
        finalized_execution_blocks: LookupMap<u64, H256>,
        /// All unfinalized execution blocks' headers hashes mapped to their `HeaderInfo`.
        /// Execution block hash -> ExecutionHeaderInfo object
        unfinalized_headers: UnorderedMap<H256, ExecutionHeaderInfo>,
        /// `AccountId`s mapped to their number of submitted headers.
        /// Submitter account -> Num of submitted headers
        submitters: LookupMap<AccountId, u32>,
        /// Max number of unfinalized blocks allowed to be stored by one submitter account
        /// This value should be at least 32 blocks (1 epoch), but the recommended value is 1024 (32 epochs)
        max_submitted_blocks_by_account: u32,
        // The minimum balance that should be attached to register a new submitter account
        min_storage_balance_for_submitter: Balance,
        /// Light client state
        finalized_beacon_header: ExtendedBeaconBlockHeader,
        finalized_execution_header: LazyOption<ExecutionHeaderInfo>,
        current_sync_committee: LazyOption<SyncCommittee>,
        next_sync_committee: LazyOption<SyncCommittee>,
    }            
    ```
* [eth2-client dependencies](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/Cargo.toml) relys heavily on the [lighthouse](https://github.com/aurora-is-near/lighthouse) codebase for it's consensus and cryptogrphic primitives. See [Cryptographic Primitives](#cryptographic-primitives) for more information.
    * `ethereum-types = "0.9.2"`
    * `eth-types =  { path = "../eth-types" }`
    * `eth2-utility =  { path = "../eth2-utility" }`
    * `tree_hash = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }`
    * `merkle_proof = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }`
    * `bls = { git = "https://github.com/aurora-is-near/lighthouse.git", optional = true, rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec", default-features = false, features = ["milagro"]}`
    * `admin-controlled =  { path = "../admin-controlled" }`
    * `near-sdk = "4.0.0"`
    * `borsh = "0.9.3"`
    * `bitvec = "1.0.0"`

* [eth2-client contract functions](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/src/lib.rs): provides the following functions in  `impl Eth2Client`
    * `fn validate_light_client_update(&self, update: &LightClientUpdate)`
    * `fn verify_finality_branch(&self, update: &LightClientUpdate, finalized_period: u64)`
    * `fn verify_bls_signatures(&self, update: &LightClientUpdate, sync_committee_bits: BitVec<u8>, finalized_period: u64,)`
    * `fn update_finalized_header(&mut self, finalized_header: ExtendedBeaconBlockHeader)`
    * `fn commit_light_client_update(&mut self, update: LightClientUpdate)`
    * `fn gc_finalized_execution_blocks(&mut self, mut header_number: u64)`
    * `fn update_submitter(&mut self, submitter: &AccountId, value: i64)`
    * `fn is_light_client_update_allowed(&self)`
* [Eth2NearRelay](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth2near_relay.rs#L84): has the following public structure

    ```
    pub struct Eth2NearRelay {
        beacon_rpc_client: BeaconRPCClient,
        eth1_rpc_client: Eth1RPCClient,
        near_rpc_client: NearRPCClient,
        eth_client_contract: Box<dyn EthClientContractTrait>,
        headers_batch_size: u64,
        ethereum_network: String,
        interval_between_light_client_updates_submission_in_epochs: u64,
        max_blocks_for_finalization: u64,
        near_network_name: String,
        last_slot_searcher: LastSlotSearcher,
        terminate: bool,
        submit_only_finalized_blocks: bool,
        next_light_client_update: Option<LightClientUpdate>,
        sleep_time_on_sync_secs: u64,
        sleep_time_after_submission_secs: u64,
        max_submitted_blocks_by_account: u32,
    }
    ```
* [Eth2NearRelay](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth2near_relay.rs#L103): Implements the following functions
    * `fn get_max_slot_for_submission(&self) -> Result<u64, Box<dyn Error>>`
    * `fn get_last_eth2_slot_on_near(&mut self, max_slot: u64) -> Result<u64, Box<dyn Error>>`
    * `fn get_last_finalized_slot_on_near(&self) -> Result<u64, Box<dyn Error>>`
    * `fn get_last_finalized_slot_on_eth(&self) -> Result<u64, Box<dyn Error>>`
    * **`pub fn run(&mut self, max_iterations: Option<u64>) `**
    * `fn wait_for_synchronization(&self) -> Result<(), Box<dyn Error>>`
    * `fn get_light_client_update_from_file(config: &Config, beacon_rpc_client: &BeaconRPCClient,) -> Result<Option<LightClientUpdate>, Box<dyn Error>> `
    * `fn set_terminate(&mut self, iter_id: u64, max_iterations: Option<u64>)`
    * `fn get_execution_blocks_between(&self, start_slot: u64, last_eth2_slot_on_eth_chain: u64,) -> Result<(Vec<BlockHeader>, u64), Box<dyn Error>>`
    * `fn submit_execution_blocks(&mut self, headers: Vec<BlockHeader>, current_slot: u64,last_eth2_slot_on_near: &mut u64,)`
    * `fn verify_bls_signature_for_finality_update(&mut self, light_client_update: &LightClientUpdate,) -> Result<bool, Box<dyn Error>>`
    * `fn get_execution_block_by_slot(&self, slot: u64) -> Result<BlockHeader, Box<dyn Error>>`
* [Eth2NearRelay](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth2near_relay.rs#L461): has a second implementation of functions for submitting light client updates
    * ` fn is_enough_blocks_for_light_client_update(&self, last_submitted_slot: u64,last_finalized_slot_on_near: u64, last_finalized_slot_on_eth: u64,) -> bool`
    * `fn is_shot_run_mode(&self) -> bool`
    * `fn send_light_client_updates_with_checks(&mut self, last_submitted_slot: u64) -> bool`
    * `fn send_light_client_updates(&mut self, last_submitted_slot: u64, last_finalized_slot_on_near: u64, last_finalized_slot_on_eth: u64,)`
    * `fn send_light_client_update_from_file(&mut self, last_submitted_slot: u64)`
    * `fn send_regular_light_client_update(&mut self, last_finalized_slot_on_eth: u64,last_finalized_slot_on_near: u64,)`
    * `fn get_attested_slot(&mut self, last_finalized_slot_on_near: u64,) -> Result<u64, Box<dyn Error>>`
    * `fn send_hand_made_light_client_update(&mut self, last_finalized_slot_on_near: u64)`
    * `fn send_specific_light_client_update(&mut self, light_client_update: LightClientUpdate)`
* [eth2near-block-relay-rs](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/eth2near-block-relay-rs) includes (but not limited to) the following additional components
    * [beacon_block_body_merkle_tree.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/beacon_block_body_merkle_tree.rs): implements merkle trees for the Beacon and the ExecutionPayload
        * `BeaconBlockBodyMerkleTree` is built on the `BeaconBlockBody` data structure, where the leaves of the Merkle Tree are the hashes of the high-level fields of the `BeaconBlockBody`.  The hashes of each element are produced by using `ssz` serialization.
        * `ExecutionPayloadMerkleTree` is a built on the `ExecutionPayload` data structure, where the leaves of the Merkle Tree are the hashes of the high-level fields of the `ExecutionPayload`. The hashes of each element are produced by using `ssz` serialization. `ExecutionPayload` is one of the field in BeaconBlockBody.  The hash of the root of `ExecutionPlayloadMerkleTree` is the 9th leaf in BeaconBlockBody Merkle Tree.
    * [beacon_rpc_client.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/beacon_rpc_client.rs): allows getting beacon block body, beacon block header and light client updates using [Beacon RPC API](https://ethereum.github.io/beacon-APIs/). It has the following functions
        * `pub fn new(endpoint_url: &str, timeout_seconds: u64, timeout_state_seconds: u64) -> Self `: Creates `BeaconRPCClient` for the given BeaconAPI `endpoint_url`
        * `pub fn get_beacon_block_body_for_block_id(&self, block_id: &str,) -> Result<BeaconBlockBody<MainnetEthSpec>, Box<dyn Error>> `: Returns `BeaconBlockBody` struct for the given `block_id`. It uses the following arguments
            * `block_id` - Block identifier. Can be one of: "head" (canonical head in node's view),"genesis", "finalized", <slot>, <hex encoded blockRoot with 0x prefix>(see [beacon-APIs/#/Beacon/getBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockV2)).
        * `pub fn get_beacon_block_header_for_block_id(&self, block_id: &str,) -> Result<types::BeaconBlockHeader, Box<dyn Error>>`: Returns `BeaconBlockHeader` struct for the given `block_id`. It uses the following arguments
            * `block_id` - Block identifier. Can be one of: "head" (canonical head in node's view),"genesis", "finalized", <slot>, <hex encoded blockRoot with 0x prefix>(see [beacon-APIs/#/Beacon/getBlockV2](https://ethereum.github.io/beacon-APIs/#/Beacon/getBlockV2)).
        *  `pub fn get_light_client_update(&self, period: u64,) -> Result<LightClientUpdate, Box<dyn Error>>`: Returns `LightClientUpdate` struct for the given `period`. It uses the following arguments
              *  `period` - period id for which `LightClientUpdate` is fetched. On Mainnet, one period consists of 256 epochs, and one epoch consists of 32 slots
        * `pub fn get_bootstrap(&self, block_root: String,) -> Result<LightClientSnapshotWithProof, Box<dyn Error>> `: Fetch a bootstrapping state with a proof to a trusted block root.  The trusted block root should be fetched with similar means to a weak subjectivity checkpoint.  Only block roots for checkpoints are guaranteed to be available.
        * `pub fn get_checkpoint_root(&self) -> Result<String, Box<dyn Error>>`
        * `pub fn get_last_finalized_slot_number(&self) -> Result<types::Slot, Box<dyn Error>> `: Return the last finalized slot in the Beacon chain
        * `pub fn get_last_slot_number(&self) -> Result<types::Slot, Box<dyn Error>>`: Return the last slot in the Beacon chain
        * `pub fn get_slot_by_beacon_block_root(&self, beacon_block_hash: H256,) -> Result<u64, Box<dyn Error>>`
        * `pub fn get_block_number_for_slot(&self, slot: types::Slot) -> Result<u64, Box<dyn Error>> `
        * `pub fn get_finality_light_client_update(&self) -> Result<LightClientUpdate, Box<dyn Error>>`
        * `pub fn get_finality_light_client_update_with_sync_commity_update(&self,) -> Result<LightClientUpdate, Box<dyn Error>>`
        * `pub fn get_beacon_state(&self, state_id: &str,) -> Result<BeaconState<MainnetEthSpec>, Box<dyn Error>>`
        * `pub fn is_syncing(&self) -> Result<bool, Box<dyn Error>>`
        * `fn get_json_from_client(client: &Client, url: &str) -> Result<String, Box<dyn Error>>`
        * `fn get_json_from_raw_request(&self, url: &str) -> Result<String, Box<dyn Error>>`
        * `fn get_body_json_from_rpc_result(block_json_str: &str,) -> Result<std::string::String, Box<dyn Error>>`
        * `fn get_header_json_from_rpc_result(json_str: &str,) -> Result<std::string::String, Box<dyn Error>>`
        * `fn get_attested_header_from_light_client_update_json_str(light_client_update_json_str: &str,) -> Result<BeaconBlockHeader, Box<dyn Error>>`
        * `fn get_sync_aggregate_from_light_client_update_json_str(light_client_update_json_str: &str,) -> Result<SyncAggregate, Box<dyn Error>>`
        * `fn get_signature_slot(&self, light_client_update_json_str: &str,) -> Result<Slot, Box<dyn Error>>`: `signature_slot` is not provided in the current API. The slot is brute-forced until `SyncAggregate` in `BeconBlockBody` in the current slot is equal to `SyncAggregate` in `LightClientUpdate`
        * `fn get_finality_update_from_light_client_update_json_str(&self, light_client_update_json_str: &str,) -> Result<FinalizedHeaderUpdate, Box<dyn Error>>`
        * `fn get_sync_committee_update_from_light_client_update_json_str(light_client_update_json_str: &str,) -> Result<SyncCommitteeUpdate, Box<dyn Error>>`
        * `pub fn get_period_for_slot(slot: u64) -> u64`
        * `pub fn get_non_empty_beacon_block_header(&self, start_slot: u64,) -> Result<types::BeaconBlockHeader, Box<dyn Error>>`
        * `fn check_block_found_for_slot(&self, json_str: &str) -> Result<(), Box<dyn Error>>`
    * [config.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/config.rs): 
    * [eth1_rpc_client.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth1_rpc_client.rs): Is used to get block headers and check sync status. It has the following functions
        * `pub fn new(endpoint_url: &str) -> Self`
        * `pub fn get_block_header_by_number(&self, number: u64) -> Result<BlockHeader, Box<dyn Error>>`
        * `pub fn is_syncing(&self) -> Result<bool, Box<dyn Error>>`
    * [execution_block_proof.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/execution_block_proof.rs): `ExecutionBlockProof` contains a `block_hash` (execution block) and a proof of its inclusion in the `BeaconBlockBody` tree hash.  The `block_hash` is the 12th field in execution_payload, which is the 9th field in `BeaconBlockBody`. The first 4 elements in proof correspondent to the proof of inclusion of `block_hash` in Merkle tree built for `ExecutionPayload`.  The last 4 elements of the proof of `ExecutionPayload` in the Merkle tree are built on high-level `BeaconBlockBody` fields.  The proof starts from the leaf. It has the following structure and functions
        * `pub struct ExecutionBlockProof {block_hash: H256, proof: [H256; Self::PROOF_SIZE],}`
        * `pub fn construct_from_raw_data(block_hash: &H256, proof: &[H256; Self::PROOF_SIZE]) -> Self`
        * `pub fn construct_from_beacon_block_body(beacon_block_body: &BeaconBlockBody<MainnetEthSpec>,) -> Result<Self, Box<dyn Error>>`
        * `pub fn get_proof(&self) -> [H256; Self::PROOF_SIZE]`
        * `pub fn get_execution_block_hash(&self) -> H256`
        * `pub fn verify_proof_for_hash(&self, beacon_block_body_hash: &H256,) -> Result<bool, IncorrectBranchLength>`
        * `fn merkle_root_from_branch(leaf: H256, branch: &[H256], depth: usize, index: usize,) -> Result<H256, IncorrectBranchLength>`
    * [hand_made_finality_light_client_update.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/hand_made_finality_light_client_update.rs): Has two implementations
        * The first implementation which calls functions in the second
            * `pub fn get_finality_light_client_update(beacon_rpc_client: &BeaconRPCClient, attested_slot: u64, include_next_sync_committee: bool,) -> Result<LightClientUpdate, Box<dyn Error>>` 
            * `pub fn get_finality_light_client_update_from_file(beacon_rpc_client: &BeaconRPCClient, file_name: &str,) -> Result<LightClientUpdate, Box<dyn Error>>`
            * `pub fn get_light_client_update_from_file_with_next_sync_committee(beacon_rpc_client: &BeaconRPCClient, attested_state_file_name: &str, finality_state_file_name: &str,) -> Result<LightClientUpdate, Box<dyn Error>>`
        * The second implementation
            * `fn get_attested_slot_with_enough_sync_committee_bits_sum(beacon_rpc_client: &BeaconRPCClient,attested_slot: u64,) -> Result<(u64, u64), Box<dyn Error>>`
            * `fn get_state_from_file(file_name: &str) -> Result<BeaconState<MainnetEthSpec>, Box<dyn Error>>`
            * `fn get_finality_light_client_update_for_state(beacon_rpc_client: &BeaconRPCClient,attested_slot: u64, signature_slot: u64, beacon_state: BeaconState<MainnetEthSpec>, finality_beacon_state: Option<BeaconState<MainnetEthSpec>>,) -> Result<LightClientUpdate, Box<dyn Error>>`
            * `fn get_next_sync_committee(beacon_state: &BeaconState<MainnetEthSpec>,) -> Result<SyncCommitteeUpdate, Box<dyn Error>>`
            * `fn from_lighthouse_beacon_header(beacon_header: &BeaconBlockHeader,) -> eth_types::eth2::BeaconBlockHeader`
            * `fn get_sync_committee_bits(sync_committee_signature: &types::SyncAggregate<MainnetEthSpec>,) -> Result<[u8; 64], Box<dyn Error>>`
            * `fn get_finality_branch(beacon_state: &BeaconState<MainnetEthSpec>,) -> Result<Vec<H256>, Box<dyn Error>>`
            * `fn get_finality_update(finality_header: &BeaconBlockHeader, beacon_state: &BeaconState<MainnetEthSpec>, finalized_block_body: &BeaconBlockBody<MainnetEthSpec>,) -> Result<FinalizedHeaderUpdate, Box<dyn Error>>`
    * [init_contract.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/init_contract.rs): Verifies light client snapshot and initializes the Ethereum Light Contract on Near.
        * `pub fn verify_light_client_snapshot(block_root: String, light_client_snapshot: &LightClientSnapshotWithProof,) -> bool `: Verifies the light client by checking the snapshot format getting the current consensus branch and verifying it via a merkle proof. 
        * `pub fn init_contract(config: &Config, eth_client_contract: &mut EthClientContract, mut init_block_root: String,) -> Result<(), Box<dyn std::error::Error>>`: Initializes the Ethereum Light Client Contract on Near.
    * [last_slot_searcher.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/last_slot_searcher.rs): Implementation of functions for searching last slot on NEAR contract. Supports both binary and linear searches.
        * `pub fn get_last_slot(&mut self, last_eth_slot: u64, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>> `
        * `n binary_slot_search(&self, slot: u64, finalized_slot: u64, last_eth_slot: u64, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>>` : Search for the slot before the first unknown slot on NEAR.  Assumptions: (1) start_slot is known on NEAR (2) last_slot is unknown on NEAR. Return error in case of problem with network connection.
        * `fn binsearch_slot_forward(&self, slot: u64, max_slot: u64, beacon_rpc_client: &BeaconRPCClient,eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>> {`: Search for the slot before the first unknown slot on NEAR. Assumptions: (1) start_slot is known on NEAR (2) last_slot is unknown on NEAR. Return error in case of problem with network connection. 
        * `fn binsearch_slot_range(&self, start_slot: u64, last_slot: u64, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>>`: Search for the slot before the first unknown slot on NEAR. Assumptions: (1) start_slot is known on NEAR (2) last_slot is unknown on NEAR. Return error in case of problem with network connection.
        * `fn linear_slot_search(&self, slot: u64, finalized_slot: u64, last_eth_slot: u64, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>>`: Returns the last slot known with block known on NEAR. `Slot` -- expected last known slot. `finalized_slot` -- last finalized slot on NEAR, assume as known slot.  `last_eth_slot` -- head slot on Eth.
        * `fn linear_search_forward(&self, slot: u64, max_slot: u64, beacon_rpc_client: &BeaconRPCClient,eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>>`: Returns the slot before the first unknown block on NEAR. The search range is [slot .. max_slot). If there is no unknown block in this range max_slot - 1 will be returned. Assumptions: (1) block for slot is submitted to NEAR. (2) block for max_slot is not submitted to NEAR.
        * `fn linear_search_backward(&self, start_slot: u64, last_slot: u64, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<u64, Box<dyn Error>> `: Returns the slot before the first unknown block on NEAR. The search range is [last_slot .. start_slot). If no such block are found the start_slot will be returned. Assumptions: (1) block for start_slot is submitted to NEAR (2) block for last_slot + 1 is not submitted to NEAR.
        * `fn find_left_non_error_slot(&self, left_slot: u64, right_slot: u64, step: i8, beacon_rpc_client: &BeaconRPCClient, eth_client_contract: &Box<dyn EthClientContractTrait>,) -> (u64, bool)`: Find the leftmost non-empty slot. Search range: [left_slot, right_slot). Returns pair: (1) slot_id and (2) is this block already known on Eth client on NEAR. Assume that right_slot is non-empty and it's block were submitted to NEAR, so if non correspondent block is found we return (right_slot, false).
        * `fn block_known_on_near( &self, slot: u64, beacon_rpc_client: &BeaconRPCClient,eth_client_contract: &Box<dyn EthClientContractTrait>,) -> Result<bool, Box<dyn Error>>`: Check if the block for current slot in Eth2 already were submitted to NEAR. Returns Error if slot doesn't contain any block.
    * [light_client_snapshot_with_proof.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/light_client_snapshot_with_proof.rs): contains the structure for `LightClientSnapshotWithProof`
        ```
        pub struct LightClientSnapshotWithProof {
            pub beacon_header: BeaconBlockHeader,
            pub current_sync_committee: SyncCommittee,
            pub current_sync_committee_branch: Vec<H256>,
        }
        ```
    * [main.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/main.rs): [Command Line Argument Parser](https://docs.rs/clap/latest/clap/) used to run the Ethereum to Near Block Relay. It contains the following functions
        * `fn get_eth_contract_wrapper(config: &Config) -> Box<dyn ContractWrapper> `
        * `fn get_dao_contract_wrapper(config: &Config) -> Box<dyn ContractWrapper>`
        * `fn get_eth_client_contract(config: &Config) -> Box<dyn EthClientContractTrait>`
        * `fn init_log(args: &Arguments, config: &Config)`
        * `fn main() -> Result<(), Box<dyn std::error::Error>>`
    * [near_rpc_client.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/near_rpc_client.rs)
        * `pub fn new(endpoint_url: &str) -> Self`
        * `pub fn check_account_exists(&self, account_id: &str) -> Result<bool, Box<dyn Error>> `
        * `pub fn is_syncing(&self) -> Result<bool, Box<dyn Error>> `

#### Ethereum Light Client Finality Update Verify Components
[finality-update-verify](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/finality-update-verify) is called from [fn verify_bls_signature_for_finality_update](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/eth2near_relay.rs#L422) to verify signatures as part of light_client updates. It relies heavily on the [lighthouse](https://github.com/aurora-is-near/lighthouse) codebase for it's consensus and cryptogrphic primitives. See [Cryptographic Primitives](#cryptographic-primitives) for more information.

* Dependencies in [Cargo.toml](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/finality-update-verify/Cargo.toml)
    * `eth-types = { path ="../../contracts/near/eth-types/", features = ["eip1559"]}`
    * `bls = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }`
    * `eth2-utility  = { path ="../../contracts/near/eth2-utility"}`
    * `tree_hash = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }`
    * `types =  { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }`
    * `bitvec = "1.0.0"`

* Functions in [lib.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/finality-update-verify/src/lib.rs)
    * `fn h256_to_hash256(hash: H256) -> Hash256`
    * `fn tree_hash_h256_to_eth_type_h256(hash: tree_hash::Hash256) -> eth_types::H256`
    * `fn to_lighthouse_beacon_block_header(bridge_beacon_block_header: &BeaconBlockHeader,) -> types::BeaconBlockHeader `
    * `pub fn is_correct_finality_update(ethereum_network: &str, light_client_update: &LightClientUpdate,   sync_committee: SyncCommittee,) -> Result<bool, Box<dyn Error>> `

#### Cryptographic Primitives
Following are cryptographic primitives used in the [eth2-client contract](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near/eth2-client) and [finality-update-verify](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/finality-update-verify). Many are from the [lighthouse](https://github.com/aurora-is-near/lighthouse) codebase. Specifically [consensus](https://github.com/aurora-is-near/lighthouse/tree/stable/consensus) and [crypto](https://github.com/aurora-is-near/lighthouse/tree/stable/crypto) functions.

Some common primitives
* [bitvec](https://docs.rs/bitvec/1.0.1/bitvec/): Addresses memory by bits, for packed collections and bitfields
* [eth2_serde_utils](https://docs.rs/eth2_serde_utils/0.1.0/eth2_serde_utils/): Serialization and deserialization utilities useful for JSON representations of Ethereum 2.0 types.
* [eth2_hashing](https://docs.rs/eth2_hashing/0.2.0/eth2_hashing/): Hashing primitives used in Ethereum 2.0
* [blst](https://docs.rs/blst/0.3.10/blst/): The blst crate provides a rust interface to the blst BLS12-381 signature library.
* [tree_hash](https://docs.rs/tree_hash/0.4.0/tree_hash/): Efficient Merkle-hashing as used in Ethereum 2.0
* [eth2_ssz_types](https://docs.rs/eth2_ssz_types/0.2.1/ssz_types/): Provides types with unique properties required for SSZ serialization and Merklization.

Some Primitives from Lighthouse
* [bls](https://github.com/aurora-is-near/lighthouse/tree/stable/crypto/bls): [Boneh–Lynn–Shacham](https://en.wikipedia.org/wiki/BLS_digital_signature) digital signature support
    * [impls](https://github.com/aurora-is-near/lighthouse/tree/stable/crypto/bls/src/impls): Implementations
        * [blst](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/impls/blst.rs)
        * [fake_crypto](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/impls/fake_crypto.rs)
        * [milagro](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/impls/milagro.rs): support for [Apache Milagro](https://milagro.apache.org/docs/milagro-intro/)
      * [functionality](https://github.com/aurora-is-near/lighthouse/tree/stable/crypto/bls/src)
          * [generic_aggregate_public_key](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_aggregate_public_key.rs)
          * [generic_aggregate_signature](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_aggregate_signature.rs)
          * [generic_keypair](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_keypair.rs)
          * [generic_public_key](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_public_key.rs)
          * [generic_public_key_bytes](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_public_key_bytes.rs)
          * [generic_secret_key](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_secret_key.rs)
          * [generic_signature](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_signature.rs)
          * [generic_signature_bytes](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_signature_bytes.rs)
          * [generic_signature_set](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/generic_signature_set.rs)
          * [get_withdrawal_credentials](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/get_withdrawal_credentials.rs)
          * [zeroize_hash](https://github.com/aurora-is-near/lighthouse/blob/stable/crypto/bls/src/zeroize_hash.rs)
* [merkle_proof](https://github.com/aurora-is-near/lighthouse/tree/stable/consensus/merkle_proof)
* [tree_hash](https://github.com/aurora-is-near/lighthouse/tree/stable/consensus/tree_hash)
* [types](https://github.com/aurora-is-near/lighthouse/tree/stable/consensus/types/src): Implements Ethereum 2.0 types including but not limited to
    * [attestation](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/attestation.rs)
    * [beacon_block](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/beacon_block.rs)
    * [beacon_committee](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/beacon_committee.rs)
    * [beacon_state](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/beacon_state.rs)
    * [builder_bid](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/builder_bid.rs)
    * [chain_spec](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/chain_spec.rs)
    * [checkpoint](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/checkpoint.rs)
    * [contribution_and_proof](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/contribution_and_proof.rs): A Validators aggregate sync committee contribution and selection proof.
    * [deposit](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/deposit.rs): A deposit to potentially become a beacon chain validator.
    * [enr_fork_id](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/enr_fork_id.rs): Specifies a fork which allows nodes to identify each other on the network. This fork is used in a nodes local ENR.
    * [eth_spec](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/eth_spec.rs): Ethereum Foundation specifications.
    * [execution_block_hash](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/execution_block_hash.rs)
    * [execution_payload](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/execution_payload.rs)
    * [fork](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/fork.rs): Specifies a fork of the `BeaconChain`, to prevent replay attacks.
    * [free_attestation](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/free_attestation.rs): Note: this object does not actually exist in the spec.  We use it for managing attestations that have not been aggregated.
    * [payload](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/payload.rs)
    * [signed_aggregate_and_proof](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/signed_aggregate_and_proof.rs): A Validators signed aggregate proof to publish on the `beacon_aggregate_and_proof` gossipsub topic.
    * [signed_beacon_block](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/signed_beacon_block.rs): A `BeaconBlock` and a signature from its proposer.
    * [slot_data]: (https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/slot_data.rs): A trait providing a `Slot` getter for messages that are related to a single slot. Useful in making parts of attestation and sync committee processing generic.
    * [slot_epoch](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/slot_epoch.rs): The `Slot` and `Epoch` types are defined as new types over u64 to enforce type-safety between the two types. Note: Time on Ethereum 2.0 Proof of Stake is divided into slots and epochs. One slot is 12 seconds. One epoch is 6.4 minutes, consisting of 32 slots. One block can be created for each slot.
    * [sync_aggregate](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/sync_aggregate.rs): Create a `SyncAggregate` from a slice of `SyncCommitteeContribution`s.  Equivalent to `process_sync_committee_contributions` from the spec.
    * [sync_committee](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/sync_committee.rs)
    * [tree_hash_impls](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/tree_hash_impls.rs): contains custom implementations of `CachedTreeHash` for ETH2-specific types.  It makes some assumptions about the layouts and update patterns of other structs in this crate, and should be updated carefully whenever those structs are changed.
    * [validator](https://github.com/aurora-is-near/lighthouse/blob/stable/consensus/types/src/validator.rs): Information about a `BeaconChain` validator.


Some Primitives from NEAR Rainbow Bridge
* [eth-types](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near/eth-types): utilities to serialize and encode eth2 types using [borsh](https://borsh.io/) and [rlp](https://ethereum.org/en/developers/docs/data-structures-and-encoding/rlp).
* [eth2-utility](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near/eth2-utility): Utility functions used for Ethereum 2.0 Consensus. Functions include
    * `fn from_str(input: &str) -> Result<Network, Self::Err> `
    * `pub fn new(network: &Network) -> Self`
    * `pub fn compute_fork_version(&self, epoch: Epoch) -> Option<ForkVersion>`
    * `pub fn compute_fork_version_by_slot(&self, slot: Slot) -> Option<ForkVersion> `
    * `pub const fn compute_epoch_at_slot(slot: Slot) -> u64`
    * `pub const fn compute_sync_committee_period(slot: Slot) -> u64`
    * `pub const fn floorlog2(x: u32) -> u32`: Compute floor of log2 of a u32.
    * `pub const fn get_subtree_index(generalized_index: u32) -> u32`
    * `pub fn compute_domain(domain_constant: DomainType, fork_version: ForkVersion, genesis_validators_root: H256,) -> H256`
    * `pub fn compute_signing_root(object_root: H256, domain: H256) -> H256`
    * `pub fn get_participant_pubkeys(public_keys: &[PublicKeyBytes], sync_committee_bits: &BitVec<u8, Lsb0>,) -> Vec<PublicKeyBytes>`
    * `pub fn convert_branch(branch: &[H256]) -> Vec<ethereum_types::H256>`
    * `pub fn validate_beacon_block_header_update(header_update: &HeaderUpdate) -> bool`
    * `pub fn calculate_min_storage_balance_for_submitter(max_submitted_blocks_by_account: u32,) -> Balance `
#### Token Transfer Process Flow
* [Token Transfer Created on Ethereum]()
* [Transaction is proved]()
* [Tokens are minted on Near]()

#### Token Transfer Components

#### References
* [Lighthouse Documentation](https://lighthouse-book.sigmaprime.io/): ETH 2.0 Consensus Client Lighthouse documentation
* [Lighthouse Github](https://github.com/sigp/lighthouse): ETH 2.0 Consensus Client Lighthouse Github
* [Lighthouse: Blog](https://lighthouse-blog.sigmaprime.io/):  ETH 2.0 Consensus Client Lighthouse Blog
* [eth2near-block-relay-rs](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/eth2near-block-relay-rs)
* [nearbridge contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearbridge)
* [nearprover contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearprover)

### Prysm Light Client


#### References
* [Prysm: Light-client (WORK IN PROGRESS)](https://github.com/jinfwhuang/prysm/pull/5): 
* [Prysm: Light-client Client WIP](https://github.com/jinfwhuang/prysm/tree/jin-light/cmd/light-client#light-client-client): An independent light client client
* [Prysm: light-client server PR](https://github.com/prysmaticlabs/prysm/pull/10034): a feature PR that implements the basic production level changes to Prysm to comply as a light-client server to begin serving light client requests




## Harmony Merkle Mount Range 

* Harmony [MMR PR Review](https://github.com/harmony-one/harmony/pull/3872) and [latest PR](https://github.com/harmony-one/harmony/pull/4198/files) uses Merkle Mountain Ranges to facilitate light client development against Harmony's sharded Proof of Stake Chain


## Near Rainbow Bridge Review
The [NEAR Rainbow bridge](https://near.org/bridge/) is in [this github repository](https://github.com/aurora-is-near/rainbow-bridge) and is supported by [Aurora-labs](https://github.com/aurora-is-near). 

It recently provided support for ETH 2.0 in this [Pull Request (762)](https://github.com/aurora-is-near/rainbow-bridge/pull/762). 

It interacts [lighthouse](https://github.com/aurora-is-near/lighthouse) for Ethereum 2.0 Consensus and tree_hash functions as well as bls signatures.

High Level their architecture is similar to the Horizon Bridge but with some key differences, including but not limited to

* interacting with the beacon chain now for finality `is_correct_finality_update`  [see finality-update-verify](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/finality-update-verify/src/lib.rs#L36)
* Updated execution block proof to use the BEACONRPCClient and with an updated merkle tree
    * Design can be found in [PR-762](https://github.com/aurora-is-near/rainbow-bridge/pull/762)



### NEAR Rainbow Bridge: Component Overview

The following smart contracts are deployed on NEAR and work in conjunction with eth2near bridging functionality to propogate blocks from Ethereum to NEAR. 

***Note** here we will focus on the `eth2-client` for ETH 2.0 Proof of Stake Bridging however if interested in however there is also an `eth-client` which was used for ETH 1.0 Proof of Work Integration using [rust-ethhash](https://github.com/nearprotocol/rust-ethash).*

* [Smart Contracts Deployed on NEAR](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near)
    * [eth2-client](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near/eth2-client) implements the Ethereum Light Client on Near 
        * it provides functions including but not limited to:
            *  validate the light client
            *  verify the finality branch
            *  verify bls signatures
            *  update finalized headers
            *  updates the submittes
            *  prune finalized blocks. 
       * It interacts with the beach chain, uses [Borsh](https://borsh.io/) for serialization and [lighthouse](https://github.com/aurora-is-near/lighthouse) for Ethereum 2.0 Consensus and tree_hash functions as well as bls signatures. See [here](https://lighthouse-book.sigmaprime.io/) for more information on lighthouse. Below is a list of dependencies from [eth2-client/Cargo.toml](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/near/eth2-client/Cargo.toml)

            ```
            [dependencies]
            ethereum-types = "0.9.2"
            eth-types =  { path = "../eth-types" }
            eth2-utility =  { path = "../eth2-utility" }
            tree_hash = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            merkle_proof = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            bls = { git = "https://github.com/aurora-is-near/lighthouse.git", optional = true, rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec", default-features = false, features = ["milagro"]}
            admin-controlled =  { path = "../admin-controlled" }
            near-sdk = "4.0.0"
            borsh = "0.9.3"
            bitvec = "1.0.0"
            ```



* [eth2near](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near) supports the relaying of blocks and the verification of finality between etherum and Near. It has the following components
    * [contract_wrapper](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/contract_wrapper):  provides rust wrappers for interacting with the [solidity contracts on near](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/near)
        * Contracts include (from [`lib.rs`](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/contract_wrapper/src/lib.rs))

            ```
            pub mod contract_wrapper_trait;
            pub mod dao_contract;
            pub mod dao_eth_client_contract;
            pub mod dao_types;
            pub mod errors;
            pub mod eth_client_contract;
            pub mod eth_client_contract_trait;
            pub mod file_eth_client_contract;
            pub mod near_contract_wrapper;
            pub mod sandbox_contract_wrapper;
            pub mod utils;
            ```

        * Dependencies include (from [contract_wrapper/Cargo.toml](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/contract_wrapper/Cargo.toml))

            ```
            [dependencies]
            borsh = "0.9.3"
            futures = "0.3.21"
            async-std = "1.12.0"
            near-sdk = "4.0.0"
            near-jsonrpc-client = "=0.4.0-beta.0"
            near-crypto = "0.14.0"
            near-primitives = "0.14.0"
            near-chain-configs = "0.14.0"
            near-jsonrpc-primitives = "0.14.0"
            tokio = { version = "1.1", features = ["rt", "macros"] }
            reqwest = { version = "0.11", features = ["blocking"] }
            serde_json = "1.0.74"
            serde = { version = "1.0", features = ["derive"] }
            eth-types = { path = "../../contracts/near/eth-types/", features = ["eip1559"]}
            workspaces = "0.5.0"
            anyhow = "1.0"
            ```

    * [eth2near-block-relay-rs](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/eth2near-block-relay-rs) is built in rust and  integrates with the Ethereum 2.0 lgihthouse consensus client to propogate blocks to near.
        * Functionality includes (from [lib.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/src/lib.rs))

            ```
            pub mod beacon_block_body_merkle_tree;
            pub mod beacon_rpc_client;
            pub mod config;
            pub mod eth1_rpc_client;
            pub mod eth2near_relay;
            pub mod execution_block_proof;
            pub mod hand_made_finality_light_client_update;
            pub mod init_contract;
            pub mod last_slot_searcher;
            pub mod light_client_snapshot_with_proof;
            pub mod logger;
            pub mod near_rpc_client;
            pub mod prometheus_metrics;
            pub mod relay_errors;
            ```

        * Dependencies include (from [eth2near-block-relay-rs/Cargo.toml](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay-rs/Cargo.toml))

            ```
            types =  { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            tree_hash = { git = "https://github.com/aurora-is-near/lighthouse.git",  rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            merkle_proof = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            eth2_hashing = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
            eth2_ssz = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }

            eth-types = { path = "../../contracts/near/eth-types/", features = ["eip1559"]}
            eth2-utility  = { path = "../../contracts/near/eth2-utility" }

            contract_wrapper = { path = "../contract_wrapper" }
            finality-update-verify = { path = "../finality-update-verify" }

            log = { version = "0.4", features = ["std", "serde"] }
            serde_json = "1.0.74"
            serde = { version = "1.0", features = ["derive"] }
            ethereum-types = "0.9.2"
            reqwest = { version = "0.11", features = ["blocking"] }
            clap = { version = "3.1.6", features = ["derive"] }
            tokio = { version = "1.1", features = ["macros", "rt", "time"] }
            env_logger = "0.9.0"
            borsh = "0.9.3"
            near-sdk = "4.0.0"
            futures = { version = "0.3.21", default-features = false }
            async-std = "1.12.0"
            hex = "*"
            toml = "0.5.9"
            atomic_refcell = "0.1.8"
            bitvec = "*"
            primitive-types = "0.7.3"

            near-jsonrpc-client = "=0.4.0-beta.0"
            near-crypto = "0.14.0"
            near-primitives = "0.14.0"
            near-chain-configs = "0.14.0"
            near-jsonrpc-primitives = "0.14.0"

            prometheus = { version = "0.9", features = ["process"] }
            lazy_static = "1.4"
            warp = "0.2"
            thread = "*"

            ```

    * [eth2near-block-relay](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/eth2near-block-relay) is built using javascript and supports ETH 1.0 Proof of Work (`ethhash`) using merkle patrica trees.
        * key classes from  [index.js](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay/index.js) include 
            * `Ethashproof` : which has functions to `getParseBlock` and ` calculateNextEpoch`
            * `Eth2NearRelay` : which interacts with the `ethClientContract`  and has a `run()` function which loops through relaying blocks and includes additional functions such as `getParseBlock` , ` submitBlock`
        * Dependencies include (from [package.json](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/eth2near-block-relay/package.json))

            ```
            "dependencies": {
                "bn.js": "^5.1.3",
                "eth-object": "https://github.com/near/eth-object#383b6ea68c7050bea4cab6950c1d5a7fa553e72b",
                "eth-util-lite": "near/eth-util-lite#master",
                "@ethereumjs/block": "^3.4.0",
                "merkle-patricia-tree": "^2.1.2",
                "prom-client": "^12.0.0",
                "promisfy": "^1.2.0",
                "rainbow-bridge-utils": "1.0.0",
                "got": "^11.8.5"
            },
            ```

    * [ethhashproof](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/ethashproof): is a commandline to calculate proof data for an ethash POW, it is used by project `SmartPool` and a decentralizedbridge between Etherum and EOS developed by Kyber Network team. It is written in `GO`.
        * Features Include
            1. Calculate merkle root of the ethash dag dataset with given epoch
            2. Calculate merkle proof of the pow (dataset elements and their merkle proofs) given the pow submission with given block header
            3. Generate dag datase
        * Dependencies include (from [ethahsproof/go.mod](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/ethashproof/go.mod))

            ```
            require (
	            github.com/deckarep/golang-set v1.7.1
                github.com/edsrzf/mmap-go v1.0.0
                github.com/ethereum/go-ethereum v1.10.4
                github.com/hashicorp/golang-lru v0.5.5-0.20210104140557-80c98217689d
                golang.org/x/crypto v0.0.0-20210322153248-0c34fe9e7dc2
            )
            ```
   
   * [finality-update-verify](https://github.com/aurora-is-near/rainbow-bridge/tree/master/eth2near/finality-update-verify) checks and updates finality using the lighthouse beacon blocks.
       * Functions include (from [lib.rs](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/finality-update-verify/src/lib.rs)) 
           * `fn h256_to_hash256(hash: H256) -> Hash256`
           * `fn tree_hash_h256_to_eth_type_h256(hash: tree_hash::Hash256) -> eth_types::H256`
           * `fn to_lighthouse_beacon_block_header(bridge_beacon_block_header: &BeaconBlockHeader,) -> types::BeaconBlockHeader {types::BeaconBlockHeader`
           * `pub fn is_correct_finality_update(ethereum_network: &str, light_client_update: &LightClientUpdate, sync_committee: SyncCommittee, ) -> Result<bool, Box<dyn Error>>`
        * Dependencies include (from [finality-update-verify/Cargo.toml](https://github.com/aurora-is-near/rainbow-bridge/blob/master/eth2near/finality-update-verify/Cargo.toml))

            ```
            [dependencies]
                eth-types = { path ="../../contracts/near/eth-types/", features = ["eip1559"]}
                bls = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
                eth2-utility  = { path ="../../contracts/near/eth2-utility"}
                tree_hash = { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
                types =  { git = "https://github.com/aurora-is-near/lighthouse.git", rev = "b624c3f0d3c5bc9ea46faa14c9cb2d90ee1e1dec" }
                bitvec = "1.0.0"

                [dev-dependencies]
                eth2_to_near_relay = { path = "../eth2near-block-relay-rs"}
                serde_json = "1.0.74"
                serde = { version = "1.0", features = ["derive"] }
                toml = "0.5.9"
            ```

The following smart contracts are deployed on Ethereum and used for propogating blocks from NEAR to Ethereum.
* [Smart Contracts deployed on Ethereum](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth) including
    * [Near Bridge Contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearbridge/contracts) including [NearBrige.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/NearBridge.sol) which the interface [INearBridge.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/INearBridge.sol)
    * Interface Overview

        ```
        interface INearBridge {
            event BlockHashAdded(uint64 indexed height, bytes32 blockHash);
            event BlockHashReverted(uint64 indexed height, bytes32 blockHash);
            function blockHashes(uint64 blockNumber) external view returns (bytes32);
            function blockMerkleRoots(uint64 blockNumber) external view returns (bytes32);
            function balanceOf(address wallet) external view returns (uint256);
            function deposit() external payable;
            function withdraw() external;
            function initWithValidators(bytes calldata initialValidators) external;
            function initWithBlock(bytes calldata data) external;
            function addLightClientBlock(bytes calldata data) external;
            function challenge(address payable receiver, uint256 signatureIndex) external;
            function checkBlockProducerSignatureInHead(uint256 signatureIndex) external view returns (bool);
        }
        ```

    * Key Storage items for epoch and  block information

        ```
            Epoch[3] epochs;
            uint256 curEpoch;

            mapping(uint64 => bytes32) blockHashes_;
            mapping(uint64 => bytes32) blockMerkleRoots_;
            mapping(address => uint256) public override balanceOf;
        ```

    * Signing and Serializing Primitives
        * [NearDecoder.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/NearDecoder.sol): handles decoing of Public Keys, Signatures, BlockProducers and LightClientBlocks using `Borsh.sol`
        * [Utils.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/Utils.sol): handles reading and writing to memory, memoryToBytes and has functions such as `keccak256Raw` and `sha256Raw`
        * [Borsh.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/Borsh.sol): [Borsh](https://borsh.io/): Binary Object Representation Serializer for Hashing. It is meant to be used in security-critical projects as it prioritizes consistency, safety, speed; and comes with a strict specification.
        * [Ed25519.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearbridge/contracts/Ed25519.sol): [Ed25519](https://ed25519.cr.yp.to/) high-speed high-security signatures

    * [Near Prover Contracts](https://github.com/aurora-is-near/rainbow-bridge/tree/master/contracts/eth/nearprover/contracts) 
        * [NearProver.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearprover/contracts/NearProver.sol): Has a `proveOutcome` which validates the outcome merkle proof and the block proof is valid using `_computeRoot` which is passed in a `bytes32 node, ProofDecoder.MerklePath memory proof`
        * [ProofDecoder.sol](https://github.com/aurora-is-near/rainbow-bridge/blob/master/contracts/eth/nearprover/contracts/ProofDecoder.sol): Uses MerklePaths to provide decoding functions such as `decodeExecutionStatus`, `decodeExecutionOutcome`, `decodeExecutionOutcomeWithId`, `decodeMerklePathItem`, `decodeMerklePath` and `decodeExecutionOutcomeWithIdAndProof`. It relies on the primitives `Borsh.sol` and `NearDecoder.sol` above.

