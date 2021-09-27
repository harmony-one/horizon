// const Prover = artifacts.require('HarmonyProver.sol');
// const rlp = require('rlp');
// const { GetProof } = require('eth-proof');

// const {
//     buffer2hex,
//     expandkey,
//     getHeader,
//     getReceiptLight,
//     getReceiptRlp,
//     getReceiptTrie,
//     index2key,
//     getReceiptProof,
//     getAccountProof,
//     getTransactionProof,
// } = require('../scripts/utils');

// const getProof = new GetProof("http://localhost:9500");

// contract('HarmonyLightClient', async accounts => {
//     let prover, client, counter;
//     let proverStateSync;
//     const blockNumber = 1;

//     it('deploy', async () => {
//         counter = await Counter.new();
//         const block = await web3.eth.getBlock(0);
//         client = await EthereumClient.new(3, 10, 3, block);
//         clientmock = await LightClientMock.new();
//         prover = await Prover.new(clientmock.address);
//         proverStateSync = await ProverStateSync.new(clientmock.address);
//     });
// });    