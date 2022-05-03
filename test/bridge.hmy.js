const rlp = require("rlp");
const headerData = require("./headers.json");
const transactions = require("./transaction.json");
const { rpcWrapper, getReceiptProof } = require("../scripts/utils");
const { expect } = require("chai");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
const Web3 = require("web3");
const web3 = new Web3();

chai.use(solidity);

let MMRVerifier, HarmonyProver;
let prover, mmrVerifier;

function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// describe("HarmonyProver", function () {
//   beforeEach(async function () {
//     MMRVerifier = await ethers.getContractFactory("MMRVerifier");
//     mmrVerifier = await MMRVerifier.deploy();
//     await mmrVerifier.deployed();

//     // await HarmonyProver.link('MMRVerifier', mmrVerifier);
//     HarmonyProver = await ethers.getContractFactory("HarmonyProver");
//     prover = await HarmonyProver.deploy();
//     await prover.deployed();
//   });

//   it("parse rlp block header", async function () {
//     console.log(mmrVerifier);
//     let header = await prover.toBlockHeader(hexToBytes(headerData.rlpheader));
//     expect(header.hash).to.equal(headerData.hash);
//   });

//   it("parse transaction receipt proof", async function () {
//     let callback = getReceiptProof;
//     let callbackArgs = [process.env.LOCALNET, prover, transactions.hash];
//     let isTxn = true;
//     let txProof = await rpcWrapper(
//       transactions.hash,
//       isTxn,
//       callback,
//       callbackArgs
//     );
//     console.log(txProof);
//     expect(txProof.header.hash).to.equal(transactions.header);

//     // let response = await prover.getBlockRlpData(txProof.header);
//     // console.log(response);

//     // let res = await test.bar([123, "abc", "0xD6dDd996B2d5B7DB22306654FD548bA2A58693AC"]);
//     // // console.log(res);
//   });
// });

let TokenLockerOnEthereum, tokenLocker;
let HarmonyLightClient, lightclient;
let WETH;
let owner, addr1, addr2;

describe("TokenLocker", function () {
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    TokenLockerOnEthereum = await ethers.getContractFactory(
      "TokenLockerOnEthereum"
    );
    tokenLocker = await TokenLockerOnEthereum.deploy();

    const wethContract = await ethers.getContractFactory("WETH");
    WETH = await wethContract.deploy();
  });

  it("issue map token test", async function () {
    await WETH.connect(owner).mint("1000000000000000");
    await WETH.connect(addr1).mint("1000000000000000");

    console.log((await WETH.balanceOf(owner.address)).toString());
    expect((await WETH.balanceOf(owner.address)).toString()).to.equals(
      "2000000000000000"
    );

    expect((await WETH.balanceOf(addr1.address)).toString()).to.equals(
      "1000000000000000"
    );
  });

  it("lock test if bridge not initialized", async function () {
    const topics1 = web3.utils.padLeft(WETH.address, 32);
    const encodeData = new ethers.utils.AbiCoder().encode(
      ["string", "string"],
      ["WETH", "WETH"]
    );
    const topics2 = ethers.utils.formatBytes32String("18");
    console.log(topics1);
    const topics = [topics1, topics1, topics2];

    const bridgeMap = await tokenLocker.onTokenMapReqEvent(topics, encodeData);

    const lockTx = tokenLocker.lock(WETH.address, addr2.address, "5000000000");
    await expect(lockTx).to.be.revertedWith("bridge does not exist");
  });

  it("unlock test", async function () {
    const rlpData = ethers.Signers.signTransaction(
      "TokenMapReq(address,uint8,string,string)"
    );

    expect(await tokenLocker.unlock(WETH.address, addr1.address, "50000000")).to
      .not.reverted;
  });
});
