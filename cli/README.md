# Horizon CLI
CLI is a utility that provides a command-line interface to all the components to the Horizon bridge and allow performing end-to-end bridge functionalities.

## CLI Help Infomation
`node index.js [command] -h`

## DAG Merkel Tree CLI
1. `node index.js dagProve generate` which calculate merkle root for epochs from [start, start+n)
```
node index.js dagProve generate 377
```
2. `node index.js dagProve blockProof` which accepts block number to calculate all necessary information in order to prove the block
```
node index.js dagProve blockProof --block 11266784 --url https://ropsten.infura.io/v3/<project-id>
```

## ELC(Ethereum Ligth Client) CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ELC deploy` deploy ELC contract to Harmony network.
```
node index.js ELC deploy http://localhost:9500 --url https://ropsten.infura.io/v3/<project-id> --block 11266872
```
2. `node index.js ELC status` display last block of ELC.
```
node index.js ELC status http://localhost:9500 <ELC_Contract_Addr>
```

## Ethereum Block Relay CLI
> Before using the CLI, fill in the private key into `.env` and execute `source .env`.
1. `node index.js ethRelay getBlockHeader` get block header from ethereum.
```
node index.js ethRelay getBlockHeader https://ropsten.infura.io/v3/<project-id> 11266872
```
2. `node index.js ethRelay relay` constantly relay blocks from Ethereum to Harmony.

## Ethereum Receipt Prove CLI
1. `node index.js EProver proof` get the proof data of the receipt of the transaction.

## Ethereum Receipt Verifier CLI
1. `node index.js EVerifier deploy` deploy EVerifier library contract to Harmony network.
2. `node index.js EVerifier verify` verify receipt MPT proof vai everifier contract, return receipt.

## Bridge CLI
1. `node index.js Bridge deploy` deploy bridge contract both on etheruem and harmony.
2. `node index.js Bridge deployFaucet` deploy a faucet ERC20 token for testing.
3. `node index.js Brodge deployFakeClient` deploy a fake lightclient for testing.
4. `node index.js Bridge change` change light client contract, only owner has access.
5. `node index.js Bridge map` map ERC20 from ethereum to harmony.
6. `node index.js Bridge crossTo` cross transfer ERC20 from ethereum to harmony.
7. `node index.js Bridge crossBack` cross transfer HRC20 from harmony back to ethereum.