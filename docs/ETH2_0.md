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

### Light Client Specification

#### Altair Light Client -- Sync Protocol
* [Altair Light Client -- Sync Protocol](https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/light-client/sync-protocol.md): The beacon chain is designed to be light client friendly for constrained environments to access Ethereum with reasonable safety and liveness.

    Such environments include resource-constrained devices (e.g. phones for trust-minimized wallets)and metered VMs (e.g. blockchain VMs for cross-chain bridges).

    This document suggests a minimal light client design for the beacon chain thatuses sync committees introduced in [this beacon chain extension]((https://github.com/ethereum/consensus-specs/blob/dev/specs/altair/beacon-chain.md).

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

