# Horizon Harmony Light Client on Ethereum
Harmony Light Client (HLC) is a checkpoint-based light client implemented as a smart contract that receives checkpoint blocks from Harmony2Ethereum relayer and stores the checkpoint block header information. 

## Functionalities
* Receive block header information relayed from Harmony2Ethereum relayer, verifiy it using BLS signature verification available in the HVerifier smart contract, and store it
* Receive and verify Proof of burn from the users as part of unlock transaction
