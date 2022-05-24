require("dotenv").config();
const Web3 = require("web3");
const BN = require("bn.js");
const rlp = require("rlp");
const { toUtf8Bytes } = require("@harmony-js/contract");
const { hexlify } = require("@harmony-js/crypto");

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
web3.eth.defaultAccount = process.env.WALLET_ADDRESS;

let toRLPHeader = (block) => {
  return rlp.encode([
    "HmnyTgd",
    "v4",
    [
      block.parentHash,
      block.miner,
      block.stateRoot,
      block.transactionsRoot,
      block.receiptsRoot,
      block.outgoingReceiptsRoot,
      block.incomingReceiptsRoot,
      block.logsBloom,
      new BN(block.number),
      block.gasLimit,
      block.gasUsed,
      new BN(block.timestamp),
      block.extraData,
      block.mixHash,
      new BN(block.viewID),
      new BN(block.epoch),
      block.shardID,
      block.lastCommitSignature,
      block.lastCommitBitmap,
      block.vrf,
      block.vdf,
      block.shardState,
      block.crossLink,
      block.slashes,
      block.mmrRoot,
    ],
  ]);
};

async function processMMRProof(err, res) {
  if (err) throw err;
  let proof = res.result;
  console.log(proof);

  let root = '0x' + proof.root;
  let width = proof.width;
  let index = 12;
  let value = web3.utils.hexToBytes("0xe40cee5629973020ce841baee9405afb73a215f27ffc1e232a5b665346abb3e6");
  let peaks = [
    "0x1086b6daeb590c506f8fb5f4aec47d861a74d04f7bef7ef4a87abd89f79dd0cf",
    "0x34b52955ac457f63ce8ccd39c0fb9f8ec288350f0e34920eae532f081f69fdc1"
  ]; //proof.peaks;
  let siblings = [
    "0x1086b6daeb590c506f8fb5f4aec47d861a74d04f7bef7ef4a87abd89f79dd0cf",
    "0xcd30063f44cf79c4ed9b7e212b1e892e2714234ef0758b9794043710eb6b480c"
  ];//proof.siblings;

  const client = new web3.eth.Contract(
    require("../build/contracts/MMR.json").abi,
    process.env.MMR
  );
  let ethMasterAccount = web3.eth.accounts.privateKeyToAccount(
    process.env.PRIVATE_KEY
  );
  web3.eth.accounts.wallet.add(ethMasterAccount);
  web3.eth.defaultAccount = ethMasterAccount.address;
  ethMasterAccount = ethMasterAccount.address;

  try {
    // console.log('number of peaks: ' + await client.methods.numOfPeaks(5).call());
    // console.log('peak indices: ' + await client.methods.getPeakIndexes(5).call());
    // let res = await client.methods.getChildren(7).call();
    // console.log('getChildren(7): ' + res.left + ', ' + res.right);
    let response = await client.methods.inclusionProof(
      root,
      width,
      index,
      value,
      peaks,
      siblings
    ).send({
      from: ethMasterAccount,
      gas: process.env.GAS_LIMIT,
      gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
    });
    console.log(response);
  } catch (error) {
    // console.log(error);
    console.log(await getRevertReason(error.receipt.transactionHash));
  }
}

const util = require("util");

(async function () {
  let txnHash = "0x54b8ef8b874e89dcec98e5472b06f0a00d80a86c8470a8888b6a781b45699064";
  let web3 = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
  const sendRpc = util.promisify(web3.currentProvider.send)
    .bind(web3.currentProvider);
    console.log(web3.utils.toDecimal("0x8"));
  console.log(await sendRpc({
    jsonrpc: "2.0",
    method: "hmyv2_getTxMmrProof",
    params: [txnHash, 88],
    id: (new Date()).getTime(),
  }));
})();

(async function () {
  let txnHash = "0xe40cee5629973020ce841baee9405afb73a215f27ffc1e232a5b665346abb3e6";
  let local = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
  local.currentProvider.send(
    {
      method: "hmyv2_getReceiptProof",
      params: [txnHash],
      jsonrpc: "2.0",
      id: "2",
    },
    // processMMRProof
    function (err, res) {
      if (err) throw err;
      let proof = res.result;
      console.log(proof);

    }
  );
});

(async function () {
  // let hash =
  //   "0x7e79e06185d57b9b54ab1b579411556cc7631629814a268cb528086eb33e7648";
  let local = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
  local.currentProvider.send(
    {
      method: "hmyv2_getFullHeader",
      params: ["20"],
      jsonrpc: "2.0",
      id: "2",
    },
    async function (err, result) {
      if (err) throw err;
      let headerBytes = toRLPHeader(result.result);
      console.log(toHexString(headerBytes));
      console.log(web3.utils.keccak256(headerBytes));
    }
  );
});

function toHexString(byteArray) {
  return Array.from(byteArray, function (byte) {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

(function () {
  let local = new Web3(new Web3.providers.HttpProvider(process.env.LOCALNET));
  local.currentProvider.send(
    {
      method: "hmyv2_getFullHeader",
      params: ["23"],
      jsonrpc: "2.0",
      id: "2",
    },
    async function (err, result) {
      if (err) throw err;
      console.log(result.result);
      let headerBytes = toRLPHeader(result.result);
      console.log(web3.utils.keccak256(headerBytes));

      // let signers = [
      //   "65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204",
      //   "02c8ff0b88f313717bc3a627d2f8bb172ba3ad3bb9ba3ecb8eed4b7c878653d3d4faf769876c528b73f343967f74a917",
      //   "e751ec995defe4931273aaebcb2cd14bf37e629c554a57d3f334c37881a34a6188a93e76113c55ef3481da23b7d7ab09",
      //   "2d61379e44a772e5757e27ee2b3874254f56073e6bd226eb8b160371cc3c18b8c4977bd3dcb71fd57dc62bf0e143fd08",
      //   "86dc2fdc2ceec18f6923b99fd86a68405c132e1005cf1df72dca75db0adfaeb53d201d66af37916d61f079f34f21fb96",
      //   "95117937cd8c09acd2dfae847d74041a67834ea88662a7cbed1e170350bc329e53db151e5a0ef3e712e35287ae954818",
      // ];
      let signers = [
        "b44e474dd0b492592b7e8b8585a8e67c7ded207ab2ae739f15cd2edc8df8255fc84548726dcfca7f28fe2661e8dbd5f5",
        "833b27bca0237310d26b67562d971c74650cc70acc156844b7b1000831e76295504e9aca44a26f31aeb29eae5c7170a7",
        "b57f4ff68d9d0b2b502fa4c8d1d1c264391caee32a2bd661d8755f38e2e40ed2f051320316f3f7d822036002c5b70117",
        "b19c650a27e11971505ac3bd6a7469498410857c3ef5441bd56d6411b11d0da47cea2ef9a1ff94e1cdd1a34d10707c02",
        "b5021089f597ad6541a95682c3eade4b26bc87012bd9a1ef22e1ca474623673863aa60429e99fd4706baf8376dae8b93",
        "830da6ecd6a63e2798bfb3dd8c4e9bdf90833a3eca2cd91889deaa8126feb58534bac9bc48e45588bc8ffd41ae1aad11",
      ];
      // [65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204 02c8ff0b88f313717bc3a627d2f8bb172ba3ad3bb9ba3ecb8eed4b7c878653d3d4faf769876c528b73f343967f74a917 e751ec995defe4931273aaebcb2cd14bf37e629c554a57d3f334c37881a34a6188a93e76113c55ef3481da23b7d7ab09 2d61379e44a772e5757e27ee2b3874254f56073e6bd226eb8b160371cc3c18b8c4977bd3dcb71fd57dc62bf0e143fd08 86dc2fdc2ceec18f6923b99fd86a68405c132e1005cf1df72dca75db0adfaeb53d201d66af37916d61f079f34f21fb96 52ecce5f64db21cbe374c9268188f5d2cdd5bec1a3112276a350349860e35fb81f8cfe447a311e0550d961cf25cb988d 678ec9670899bf6af85b877058bea4fc1301a5a3a376987e826e3ca150b80e3eaadffedad0fedfa111576fa76ded980c 16513c487a6bb76f37219f3c2927a4f281f9dd3fd6ed2e3a64e500de6545cf391dd973cc228d24f9bd01efe94912e714]
      let encoded = rlp.encode(signers);
      // console.log(rlp.decode(encoded));
      // const keys = signers.map(signer => hexlify(toUtf8Bytes(signer)));

      const client = new web3.eth.Contract(
        require("../build/contracts/HarmonyLightClient.json").abi,
        process.env.CLIENT
      );
      let ethMasterAccount = web3.eth.accounts.privateKeyToAccount(
        process.env.PRIVATE_KEY
      );
      web3.eth.accounts.wallet.add(ethMasterAccount);
      web3.eth.defaultAccount = ethMasterAccount.address;
      ethMasterAccount = ethMasterAccount.address;

      try {
        await client.methods.addBlock(headerBytes, encoded).send({
          from: ethMasterAccount,
          gas: process.env.GAS_LIMIT,
          gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
        });
        console.log("mmr: " + (await client.methods.mmrRoot().call()));
        console.log("blockHash: " + (await client.methods.blockHash1().call()));
        console.log("sig: " + (await client.methods.sig().call()));
        console.log("status: " + (await client.methods.status().call()));
      } catch (error) {
        console.log(await getRevertReason(error.receipt.transactionHash));
      }
    }
  );
});

// (async function() {
//   let sig = "0x84bfece7b2f0e0c9156a5763c8fc1b42383321347e978776b03f259aed500e8926ae7b206eb06780ee44e8e6d39ca7bc05ce9cd967d7136ccd667e1453ab18dc9f36d9dbc60a7c626d6aa4f865b53c4154c391c96863d6ed117d9b2e3e316630";
//   let blockHash = "0xccafeb5a1350eb361186b1e019515d1c8cc45a7021ff94a20cd342fb90d1a6df";
//   let signers = [
//     "65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204",
//     "02c8ff0b88f313717bc3a627d2f8bb172ba3ad3bb9ba3ecb8eed4b7c878653d3d4faf769876c528b73f343967f74a917",
//     "e751ec995defe4931273aaebcb2cd14bf37e629c554a57d3f334c37881a34a6188a93e76113c55ef3481da23b7d7ab09",
//     "2d61379e44a772e5757e27ee2b3874254f56073e6bd226eb8b160371cc3c18b8c4977bd3dcb71fd57dc62bf0e143fd08",
//     "86dc2fdc2ceec18f6923b99fd86a68405c132e1005cf1df72dca75db0adfaeb53d201d66af37916d61f079f34f21fb96",
//     "95117937cd8c09acd2dfae847d74041a67834ea88662a7cbed1e170350bc329e53db151e5a0ef3e712e35287ae954818",
//   ];
//   let encoded = rlp.encode(signers);
//   const client = new web3.eth.Contract(
//     // require("./build/contracts/Client.json").abi,
//     // process.env.CLIENT
//     require("./build/contracts/BLSValidators.json").abi,
//     process.env.BLSValidators
//   );
//   // console.log(client.methods);
//   let ethMasterAccount = web3.eth.accounts.privateKeyToAccount(
//     process.env.PRIVATE_KEY
//   );
//   web3.eth.accounts.wallet.add(ethMasterAccount);
//   web3.eth.defaultAccount = ethMasterAccount.address;
//   ethMasterAccount = ethMasterAccount.address;
//   try {
//     // await client.methods
//     //   .verifyFull(blockHash, web3.utils.hexToBytes(sig), encoded)
//     //   .send({
//     //     from: ethMasterAccount,
//     //     gas: process.env.GAS_LIMIT,
//     //     gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
//     //   });
//     // let estimatedGas = await client.methods
//     //   .testCheckSigAGG()
//     //   .estimateGas({ from: process.env.WALLET_ADDRESS });
//     let result = await client.methods
//       .testCheckSigAGG()
//       .send({
//         from: ethMasterAccount,
//         gas: process.env.GAS_LIMIT,
//         gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
//       });
//     console.log(result);
//     // console.log(await client.methods.blockHash1().call());
//   } catch (error) {
//     console.log(error);
//     console.log(await getRevertReason(error.receipt.transactionHash));
//   }
// });

// (async function () {
//   let signers = [
//     "65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204",
//     "02c8ff0b88f313717bc3a627d2f8bb172ba3ad3bb9ba3ecb8eed4b7c878653d3d4faf769876c528b73f343967f74a917",
//     "e751ec995defe4931273aaebcb2cd14bf37e629c554a57d3f334c37881a34a6188a93e76113c55ef3481da23b7d7ab09",
//     "2d61379e44a772e5757e27ee2b3874254f56073e6bd226eb8b160371cc3c18b8c4977bd3dcb71fd57dc62bf0e143fd08",
//     "86dc2fdc2ceec18f6923b99fd86a68405c132e1005cf1df72dca75db0adfaeb53d201d66af37916d61f079f34f21fb96",
//     "95117937cd8c09acd2dfae847d74041a67834ea88662a7cbed1e170350bc329e53db151e5a0ef3e712e35287ae954818",
//   ];
//   let encoded = rlp.encode(signers);
//   const client = new web3.eth.Contract(
//     require("./build/contracts/Client.json").abi,
//     process.env.CLIENT
//   );
//   let res = await client.methods.verify(encoded).call();
//   console.log(res);
//   // console.log(web3.utils.keccak256(signers[0]));
// });

async function getRevertReason(txHash) {
  const tx = await web3.eth.getTransaction(txHash);

  var result = await web3.eth.call(tx, tx.blockNumber);

  result = result.startsWith("0x") ? result : `0x${result}`;

  if (result && result.substr(138)) {
    console.log(result);
    console.log(`0x${result.substr(138)}`);
    const reason = web3.utils.toAscii(`0x${result.substr(138)}`);
    console.log("Revert reason:", reason);
    return reason;
  } else {
    console.log("Cannot get reason - No return value");
  }
}

// (async function () {
//   const header =
//     "0xf902a687486d6e79546764827634f90298a046d453d02190d58ed7b6bf8fad95729ca3852e57502eb17544527ef337eae639940b585f8daefbc68a311fbd4cb20d9174ad174016a002a1b3f243be95e879b98f123c13f83ef05790d0caf53951c47427f91c520b7ba056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000048404c4b4008084602a14a680a00000000000000000000000000000000000000000000000000000000000000000048080b860c8b68b2454f6c02bb6b11eede2523546b623c129d7e61c78a167c81a5a587c9b882b1eedb0ed6ed8997236345d11260bf50ec2de441c37e7aa608bfc7747042d5fe34ce2d5ec1cb1455c7b0d76ef2fc380e2b98c934a0cfea831ac59bcc0800c7f8080808080a0e45d77b8ff050af5b5c989a10bd75250d1d8d67ea68fe03a6b2bf1f32f7617d6";
//   let headerBytes = web3.utils.hexToBytes(header);
//   // console.log(headerBytes);
//   console.log(headerBytes.length);
//   const client = new web3.eth.Contract(
//     require("./build/contracts/Client.json").abi,
//     process.env.CLIENT
//   );

//   // console.log(client.methods);
//   let ethMasterAccount = web3.eth.accounts.privateKeyToAccount(
//     process.env.PRIVATE_KEY
//   );
//   web3.eth.accounts.wallet.add(ethMasterAccount);
//   web3.eth.defaultAccount = ethMasterAccount.address;
//   ethMasterAccount = ethMasterAccount.address;
//   console.log(ethMasterAccount);
//   try {
//     // let estimatedGas = await client.methods
//     //   .addHeader(headerBytes)
//     //   .estimateGas({ from: process.env.WALLET_ADDRESS });
//     // console.log(estimatedGas);
//     await client.methods.addHeader(headerBytes).send({
//       from: ethMasterAccount,
//       gas: process.env.GAS_LIMIT,
//       gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

// const options = {
//   from: process.env.WALLET_ADDRESS,
//   gas: process.env.GAS_LIMIT,
//   gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
// };

// (async function () {
//   // web3.eth.net.getId().then(console.log);
//   let myBalanceWei = await web3.eth.getBalance(web3.eth.defaultAccount);
//   console.log(myBalanceWei);
//   // const mmrJson = require("./build/contracts/MMRWrapper.json");
//   const mmr = new web3.eth.Contract(
//     require("./build/contracts/MMRWrapper.json").abi,
//     process.env.MMR_WRAPPER
//   );
//   // console.log(mmr);
//   let hashes = [
//     "0x28e5462850309da67158caf39b33f76288985bd14a907451a2d2f1f1f2d84613",
//     "0x3720e123f0e20ab4247b4b0540207d3b67a0cd74f5564889503195d7e0eeaccd",
//     "0x24ac79e056fa4c2e054a87bb9154036ffdd8be542322f62b2a12f7dbfda9c04c",
//     "0xe0a887b68c8ae8865e2b08fe558283064c053bb18bfdc083ef3b2077051086f4",
//     "0xccdecd563ad11d36b6f1a17c0a33a6e575d717c78835bfb1f4aec5fb1e3b0213",
//     "0xb25242460bb7905b883ce6bc11296bc065106b00eb6c55d52b8eba777d239d4d",
//     "0x86227fe9302af115b5001f20e6bc688b5dbe8131ac0f5ab0ba7dbdca96ca515e",
//     "0xb02424fbe477ad4d44840042addf61399b32b131f1f1cbd9ca0a41a43fb0488d",
//     "0xea53f4f0625edf727a750b721b124e58e2a73f80606ab47601f4493f6b4ca920",
//     "0xc10a1d32abf4c9bb8628ed9c289d0790cec090e85f5586a2cc9feae2d2095eb8",
//     "0x90f1d354694b2c83dc73e44fa404dd97fa92cafcdb02dac93e614585f7426660",
//     "0x9e7802f72ebac7e859b1f94a53a21ed5452dc5027bf77e5eac75597dd3be50bc",
//     "0x8cdbf8d4fbb24c5e73abac49dc3483a0d39ea27dbd19ed3b52396aadfacf7672",
//     "0xeca29f132744660af63ba2c86cfdd3e7e16b6cc01094475a7d8cba99f8910022",
//     "0xc695e1095f2e1139b32ca6e27c4d8e06a34bc425b9c68b0c7dae0c44f821111c",
//     "0xc4dcbf0bad38d239dfd54d96644605b80f36f87561a9400d5e1f889dea0163c1",
//     "0x6056009ca1e5f9f793f9b9d0e17e469f799805810e930ea4c2cbc44b1c6d509e",
//     "0x1018c24bc3a44c983bc47381abe43975e47a1fe0baede6f9a40229bb316a7c31",
//   ];
//   console.log(hashes.length)
//   let estimatedGas = await mmr.methods.addTree(hashes, 10).estimateGas({from: process.env.WALLET_ADDRESS});
// //   await mmr.methods.addTree(hashes, 10).send({
// //     from: process.env.WALLET_ADDRESS,
// //     gas: process.env.GAS_LIMIT,
// //     gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
// //   });
// //   let res = await mmr.methods.getRoot().call();
//   console.log(estimatedGas);
//   const encoded = rlp.encode(hashes);
//   estimatedGas = await mmr.methods.deserialize(encoded).estimateGas({from: process.env.WALLET_ADDRESS});
//   console.log(estimatedGas);
// })();

// const header =
//   "0xf9032787486d6e79546764827634f90319a080389b680f60ed71387db3e9909f09160ef9a19d32b204485a8e926ea46754cb940b585f8daefbc68a311fbd4cb20d9174ad174016a00fd45a16d7b29584880824530746a3ef42864c9c42c3c8301e239584d3c8efb9a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421b9010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000018404c4b4008084602dc56480a00000000000000000000000000000000000000000000000000000000000000000018080b86000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080b88094538373ee3f8cdcd02c4dfb95f55e8785da534e1d7dfe1bab1ef10f82b66b238ba0444e67576b683e968c5769e1bd9f411d2e9957462a2edae7b5adc0538f79fe6214307fa30c634c0c2cc456c97a024581a504a73b138dd496dbdff542b9ab8454287fa531258146ebe9e845adf39cec5286ba554edb4c5a3e1a585a4d0d8780808080a0dfe4a42e160d97fb51aba8b895fcc29564d94ef95094bdb10cec48a545bf8375";
// // let headerBytes = web3.utils.hexToBytes(header);

// const fromHexString = hexString =>
//   new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

//   const headerBytes = fromHexString(header);

// console.log(rlp.decode(headerBytes,  [skipRemainderCheck=false]));

// function byteToHexString(uint8arr) {
//   if (!uint8arr) {
//     return '';
//   }

//   var hexStr = '';
//   for (var i = 0; i < uint8arr.length; i++) {
//     var hex = (uint8arr[i] & 0xff).toString(16);
//     hex = (hex.length === 1) ? '0' + hex : hex;
//     hexStr += hex;
//   }

//   return hexStr.toUpperCase();
// }

// function hexStringToByte(str) {
//   if (!str) {
//     return new Uint8Array();
//   }

//   var a = [];
//   for (var i = 0, len = str.length; i < len; i+=2) {
//     a.push(parseInt(str.substr(i,2),16));
//   }

//   return new Uint8Array(a);
// }

// console.log(headerBytes);
