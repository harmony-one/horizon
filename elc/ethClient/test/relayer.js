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

json = ClientJson
ethClientAddr = "0x44606b88d70b4ac403eb3eb6b38f32cdac241007" //await deploy_contract(json)

const ethClient = client.contracts.createContract(
json.abi,
ethClientAddr
);
ethClient.wallet.addByPrivateKey(process.env.PRIVATE_KEY);

async function relay() {




  // var resp = await ethClient.methods.getStateRoot("0xf1a42653809ac8d63e8791d174bc8dd41c714d07f5af57190caa2a0c73f569d2").call(options);

  // console.log("getStateRoot: " + resp);


  // console.log(resp)


  web3.eth.subscribe('newBlockHeaders', (error, result) => {
  	catchUp(error, result);
  });
}

async function catchUp(error, event) {

	var maxHeight = await ethClient.methods.getBlockHeightMax().call(options);
	console.log("getBlockHeightMax: " + maxHeight);
	console.log(event)
	maxHeight = parseInt(maxHeight)
	while (maxHeight < event.number) {
  		maxHeight = await ethClient.methods.getBlockHeightMax().call(options);
		maxHeight = parseInt(maxHeight)
		console.log("Block lagging behind, maxHeight: " + maxHeight + ", latestHeight: " + event.number);

		nextHeight = parseInt(maxHeight) + 1
		var nextBlock = await web3.eth.getBlock(nextHeight);

		if (nextBlock != null) {
			nextBlockHex = encodeBlock(nextBlock)

			try {
				response = await ethClient.methods.addBlockHeader(nextBlockHex).send(options);
			} catch(e) {
			    console.log('Error caught');
			    return
			}
			if (response.transaction.receipt != null && response.transaction.receipt.status == "0x1") {
			    maxHeight = nextHeight
				console.log("Contract " + json.contractName + " call successfully")
			} else {
				console.log("Contract " + json.contractName + " call failed!")

				var nextBlock = await web3.eth.getBlock(nextHeight - 1);

				if (nextBlock != null) {
					nextBlockHex = encodeBlock(nextBlock)
					try {
						response = await ethClient.methods.addBlockHeader(nextBlockHex).send(options);
					} catch(e) {
					    console.log('Error caught');
					    return
					}
				}
				return
			}
		} else {
			return
		}
	}
	console.log("Event handling done.")
	return 
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

relay()