# Horizon CLI
CLI is a utility that provides a command-line interface to all the components to the Horizon bridge and allow performing end-to-end bridge functionalities. A reference implementation is available under [near's rainbow-bridge cli](https://github.com/near/rainbow-bridge/tree/master/cli), which can be used to develop this component.

## DAG Merkel Tree CLI
1. `node index.js dagProve generate` which calculate merkle root for epochs from [start, start+n)
2. `node index.js dagProve blockProof` which accepts block number to calculate all necessary information in order to prove the block

## ELC(Ethereum Ligth Client) CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ELC deploy` deploy ELC contract to Harmony network.
2. `node index.js ELC status` display last block of ELC.

## Ethereum Block Relay CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ethRelay getBlockHeader` get block header from ethereum.
2. `node index.js ethRelay relay` constantly relay blocks from Ethereum to Harmony.

## Ethereum Receipt Prove CLI
1. `node index.js EProve proof` get the proof data of the receipt of the transaction.

## Ethereum Receipt Verifier CLI
1. `node index.js EVerifier deploy` deploy EVerifier library contract to Harmony network.
2. `node index.js EVerifier verify` verify receipt MPT proof vai everifier contract, return receipt.