# Horizon Ethereum Verifier (EVerifier)
EVerifier is a smart contract deployed on Harmony that verifies the Proof of lock sent by the user as part of the mint transaction. A reference implementation is available under [near's eth-prover](https://github.com/near/rainbow-bridge-rs/blob/master/eth-prover/src/lib.rs), which can be ported to develop this component.

## Requirements
- nodejs 
- truffle
- solidity (solc)

## Installation instructions
1. `yarn` or `npm install`

## Compilation
```
truffle compile
```

## Testing
```
truffle test
```