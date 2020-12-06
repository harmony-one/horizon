require('dotenv').config()
const { Harmony } = require("@harmony-js/core");
const { ChainID, ChainType, hexToNumber, Unit } = require("@harmony-js/utils");
const hmy = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  "https://api.s0.b.hmny.io",
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);
const hmy_local = new Harmony(
  // let's assume we deploy smart contract to this end-point URL
  "http://127.0.0.1:9500",
  {
    chainType: ChainType.Harmony,
    chainId: ChainID.HmyTestnet,
  }
);
var client = hmy

const ClientJson = require("../build/contracts/Client.json");

const options = { gasPrice: 1000000000, gasLimit: 6721900 };

var coreLibAddr = ""


// This data file contain headers data from block #6419330 --> #6419350 of Ropsten testnet
const headersData1 = require("../data/ropsten");
const rlp = require("rlp");
const Web3 = require("web3");

var web3 = new Web3("wss://ropsten.infura.io/ws/v3/03f8907457e847d7b14aa072355c8d03");

async function deploy() {
  json = ClientJson
  ethClientAddr = await deploy_contract(json)
 
  const ethClient = client.contracts.createContract(
    json.abi,
    ethClientAddr
  );
  ethClient.wallet.addByPrivateKey(process.env.PRIVATE_KEY);


  var blockHash = "0xf82990de9b368d810ce4b858c45717737245aa965771565f8a41df4c75acc171"

  // var rlpBlockHeader = "0xf90217a005e37f4ea28008554ea6f332e70e556d994c7fe14854563a811e58131dcb36e8a01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347941e9939daaad6924ad004c2560e90804164900341a04914025aa9ea9f274b174205adde3243eec74589bef9a0e78a433763b2f8caa3a076de858022a0904dbc0d6ed58f42423abe3b3ced468f81636d52c74d2186efa3a0ba4f6879d2ccd6eec8351435f78d3da607b33d82bac26583ecc79a74a7485299b9010080080000008000000000000000000002000000014400008000100400002001080000800004000100008000040080410008000000400000000000000000008080800008400008000000000008000010000001000000000000080000000000000000000030000000000000104000000000000004000004080000001010000004600000020080000200080000000000000000000000000c0000000000200000010000400000200000000040000000010000000c04800000800000100001000040000004000204000000200000000020000000800004000c20002000000000040001010000080010000004000000000000000000000044400000000002000080400087037b56173c36b2833c5e8683666c488310bfad845957394e96706f6f6c2e65746866616e732e6f726720284d4e3729a0673c72b485df4da9e90a0101fa664792b10b3e7086f31737e87e6810a2608a1088f326a04006c213c0"

  // var txRoot = "0x76de858022a0904dbc0d6ed58f42423abe3b3ced468f81636d52c74d2186efa3"

  var maxHeight = await ethClient.methods.getBlockHeightMax().call(options);

  console.log("getBlockHeightMax: " + maxHeight);
  nextHeight = parseInt(maxHeight) + 1
  console.log("nextHeight: " + nextHeight);

  var nextBlock = await web3.eth.getBlock(nextHeight);

  nextBlockHex = encodeBlock(nextBlock)
  console.log(nextBlockHex)


  response = await ethClient.methods.addBlockHeader(nextBlockHex).send(options);
  if (response.transaction.receipt.status == "0x1") {
    console.log("Contract " + json.contractName + " call successfully")
  } else {
    console.log("Contract " + json.contractName + " call failed!")
    process.exit(0);
  }



  var resp = await ethClient.methods.VerifyReceiptsHash(nextBlock.hash, nextBlock.receiptsRoot).call(options);

  console.log(resp)

  // var resp = await ethClient.methods.getBlockHeightMax().call(options);

  // console.log("getBlockHeightMax: " + resp);

  // console.log("getStateRoot: " + resp);




  // web3.eth.subscribe('newBlockHeaders', function(error, event) {
  //   console.log(error);
  //   console.log(event);
  // });
}


async function deploy_contract(contractJson) {
  let contract = client.contracts.createContract(contractJson.abi);
  contract.wallet.addByPrivateKey(process.env.PRIVATE_KEY);

  const latest = await web3.eth.getBlockNumber() - 10;
  var resp = await web3.eth.getBlock(latest);

  let contractOptions = {  arguments: [encodeBlock(resp)], data: contractJson.bytecode };

  let response = await contract.methods.contractConstructor(contractOptions).send(options);

  if (response.transaction.receipt.status == "0x1") {
    console.log("Contract " + contractJson.contractName + " deployed at " + response.transaction.receipt.contractAddress)

    return response.transaction.receipt.contractAddress
  } else {
    console.log("Contract " + contractJson.contractName + " deployment failed!")
    process.exit(0);
  }

  return response
  
}

function encodeBlock(blockHeader) {
    return toHexString(rlp.encode([
            blockHeader.parentHash,
            blockHeader.sha3Uncles,
            blockHeader.miner,
            blockHeader.stateRoot,
            blockHeader.transactionsRoot,
            blockHeader.receiptsRoot,
            blockHeader.logsBloom,
            Web3.utils.toBN(blockHeader.difficulty),
            blockHeader.number,
            blockHeader.gasLimit,
            blockHeader.gasUsed,
            blockHeader.timestamp,
            blockHeader.extraData,
            blockHeader.mixHash,
            blockHeader.nonce
        ]))
}


function toHexString(byteArray) {
    let s = '0x';
    byteArray.forEach(function (byte) {
        s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
    });
    return s;
}

deploy().then(() => {
  process.exit(0);
})