require("dotenv").config();
const Web3 = require("web3");
const BN = require("bn.js");

const web3 = new Web3(process.env.LOCALNET);
let ethMasterAccount = web3.eth.accounts.privateKeyToAccount(
  process.env.PRIVATE_KEY
);
web3.eth.accounts.wallet.add(ethMasterAccount);
web3.eth.defaultAccount = ethMasterAccount.address;
ethMasterAccount = ethMasterAccount.address;

async function deploy() {
  const contractJson = require("../build/contracts/HarmonyLightClient.json");
  const contract = new web3.eth.Contract(contractJson.abi);

  const response = await contract
    .deploy({
      data: contractJson.bytecode,
      arguments: [],
    })
    .send({
      from: ethMasterAccount,
      gas: process.env.GAS_LIMIT,
      gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
    });
  const addr = `${response.options.address}`;
  console.log("Deployed HarmonyLightClient contract to", addr);
  return addr;
}
// deploy().then(()=>{});

async function deployMMR() {
  const contractJson = require("../build/contracts/MMR.json");
  const contract = new web3.eth.Contract(contractJson.abi);

  const response = await contract
    .deploy({
      data: contractJson.bytecode,
      arguments: [],
    })
    .send({
      from: ethMasterAccount,
      gas: process.env.GAS_LIMIT,
      gasPrice: new BN(await web3.eth.getGasPrice()).mul(new BN(1)),
    });
  const addr = `${response.options.address}`;
  console.log("Deployed HarmonyLightClient contract to", addr);
  return addr;
}
deployMMR().then(()=>{});