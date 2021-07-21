require("dotenv").config();
const { Harmony } = require("@harmony-js/core");
const rlp = require("rlp");
const Web3 = require("web3");
const bigInt = require("big-integer");
const { ChainID, ChainType, hexToNumber } = require("@harmony-js/utils");
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.TESTNET_URL));
const hmy = new Harmony(process.env.TESTNET_URL, {
  chainType: ChainType.Harmony,
  chainId: Number(process.env.HMY_CHAIN_ID),
});
hmy.wallet.addByPrivateKey(process.env.PRIVATE_KEY);

function concatTypedArrays(a, b) { // a, b TypedArray of same type
  var c = new (a.constructor)(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function concatBuffers(a, b) {
  return concatTypedArrays(
      new Uint8Array(a.buffer || a), 
      new Uint8Array(b.buffer || b)
  ).buffer;
}

(async function () {
  let sig =
  "0xb778f4d142f65c4f3fffb9fdcb2bba7bef120c62a257bdafaf86ce5a6ec5b60f49613b30eda6d90ecd0d36d151a19116681158c20ed1c4aa687e3380f1147c5f09173a5210c5580cd60ff887fed14aed7f353b107ca32a31e66d3c170dab3692"
    // "0x9288e020d18d05925a41ebc24758fe0053c182b8d7ed2250b5b71fe04688a15d9d0b0d876bcc4c997d248725bc3a23f60638870d8e6d7e3462d788896e01f8a6b45e050686664d0aae8a1f9c21b00d7d85b3a492007eddc5bc61b75386c4da2e";
  // "0x84bfece7b2f0e0c9156a5763c8fc1b42383321347e978776b03f259aed500e8926ae7b206eb06780ee44e8e6d39ca7bc05ce9cd967d7136ccd667e1453ab18dc9f36d9dbc60a7c626d6aa4f865b53c4154c391c96863d6ed117d9b2e3e316630";
  let blockHash =
    "0xccafeb5a1350eb361186b1e019515d1c8cc45a7021ff94a20cd342fb90d1a6df";
  // let signers = [
  //   "65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204",
  //   "02c8ff0b88f313717bc3a627d2f8bb172ba3ad3bb9ba3ecb8eed4b7c878653d3d4faf769876c528b73f343967f74a917",
  //   "e751ec995defe4931273aaebcb2cd14bf37e629c554a57d3f334c37881a34a6188a93e76113c55ef3481da23b7d7ab09",
  //   "2d61379e44a772e5757e27ee2b3874254f56073e6bd226eb8b160371cc3c18b8c4977bd3dcb71fd57dc62bf0e143fd08",
  //   "86dc2fdc2ceec18f6923b99fd86a68405c132e1005cf1df72dca75db0adfaeb53d201d66af37916d61f079f34f21fb96",
  //   "95117937cd8c09acd2dfae847d74041a67834ea88662a7cbed1e170350bc329e53db151e5a0ef3e712e35287ae954818",
  // ];
  let signers = [
    "0x65f55eb3052f9e9f632b2923be594ba77c55543f5c58ee1454b9cfd658d25e06373b0f7d42a19c84768139ea294f6204"
    // "0xb44e474dd0b492592b7e8b8585a8e67c7ded207ab2ae739f15cd2edc8df8255fc84548726dcfca7f28fe2661e8dbd5f5",
    // "833b27bca0237310d26b67562d971c74650cc70acc156844b7b1000831e76295504e9aca44a26f31aeb29eae5c7170a7",
    // "b57f4ff68d9d0b2b502fa4c8d1d1c264391caee32a2bd661d8755f38e2e40ed2f051320316f3f7d822036002c5b70117",
    // "b19c650a27e11971505ac3bd6a7469498410857c3ef5441bd56d6411b11d0da47cea2ef9a1ff94e1cdd1a34d10707c02",
    // "b5021089f597ad6541a95682c3eade4b26bc87012bd9a1ef22e1ca474623673863aa60429e99fd4706baf8376dae8b93",
    // "830da6ecd6a63e2798bfb3dd8c4e9bdf90833a3eca2cd91889deaa8126feb58534bac9bc48e45588bc8ffd41ae1aad11",
  ];
  let encoded = rlp.encode(signers);
  const contractJson = require("./build/contracts/Client.json");
  let instance = hmy.contracts.createContract(
    contractJson.abi,
    process.env.CLIENT
  );
  let options = { gasPrice: 1000000000, gasLimit: 6721900 };

  try {

    // let p1 = web3.utils.hexToBytes("0x1691a151d1360dcd0ed9a6ed303b61490fb6c56e5ace86afafbd57a2620c12ef7bba2bcbfdb9ff3f4f5cf642d1f478b7");
    // let p2 = web3.utils.hexToBytes("0x1236ab0d173c6de6312aa37c103b357fed4ad1fe87f80fd60c58c510523a17095f7c14f180337e68aac4d10ec2581168");
    // console.log(concatBuffers(p1, p2));
    // console.log(instance.methods);
    let res = await instance.methods
      // .verifyFull(blockHash, web3.utils.hexToBytes(sig), encoded)
      // .g2PointOf(web3.utils.hexToBytes(signers[0]))
      // .hash2G2(blockHash)
      // .getG2(web3.utils.hexToBytes(sig))
      .tryMe(web3.utils.hexToBytes(signers[0]), blockHash, web3.utils.hexToBytes(sig))
      .send(options);
      // .estimateGas({ gasPrice: '0x3B9ACA00' });
    console.log(res);
    // console.log(await instance.methods.getG2Point().call(options));
    console.log(await instance.methods.status().call(options));
    
    // let b = web3.utils.hexToBytes(sig);
    // console.log(b.length);

    
    // let p3 = Buffer.concat(web3.utils.hexToBytes(p1), web3.utils.hexToBytes(p2));
    
    // console.log(p3.length);

    // var q = new bigInt("144e474dd0b492592b7e8b8585a8e67c7ded207ab2ae739f15cd2edc8df8255fc84548726dcfca7f28fe2661e8dbd5f5", 16); 
    // var r = new bigInt("159b458ce55eb625172db19dfc254732fe1c922c14c1b4f39e2abc5f160644a691415afad42281791fda6e67b2e87ca7", 16); 
    // console.log(q.toString());
    // console.log(r.toString());
    
    // let result = await instance.methods.unmarshall(web3.utils.hexToBytes(signers[0])).send(options);
    // console.log(result);
    // console.log(await instance.methods.x().call(options));
    // console.log(await instance.methods.y().call(options));

    // var q = new bigInt("b44e474dd0b492592b7e8b8585a8e67c7ded207ab2ae739f15cd2edc8df8255f", 16);
    // console.log(q.toString());
    // q = new bigInt("c84548726dcfca7f28fe2661e8dbd5f500000000000000000000000000000000", 16);
    // console.log(q.toString());
  } catch (error) {
      console.log(error);
    // console.log(await getRevertReason(error.receipt.transactionHash));
  }
})();

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
