const path = require('path')
const os = require('os')
const exec = require('child_process').exec
const utils = require('ethereumjs-util')
const BN = require('bn.js')
const { RobustWeb3, sleep } = require('../harmony-bridge-lib/robust')
const { Harmony } = require("@harmony-js/core")
const { ChainID, ChainType, hexToNumber, Unit } = require("@harmony-js/utils")
const rlp = require("rlp");
const Web3 = require("web3");
const MAX_SUBMIT_BLOCK = 50
const BRIDGE_SRC_DIR = path.join(__dirname, '..')


function execute(command, _callback) {
  return new Promise((resolve) =>
    exec(command, (error, stdout, _stderr) => {
      if (error) {
        console.log(error)
      }
      resolve(stdout)
    })
  )
}

function toHexString(byteArray) {
  let s = '0x';
  byteArray.forEach(function (byte) {
      s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
  });
  return s;
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

//eth2near
function web3BlockToRlp(blockData) {
  // difficulty is only used and make sense in PoW network
  blockData.difficulty = parseInt(blockData.difficulty || '0', 10)
  blockData.totalDifficulty = parseInt(blockData.totalDifficulty, 10)
  blockData.uncleHash = blockData.sha3Uncles
  blockData.coinbase = blockData.miner
  blockData.transactionTrie = blockData.transactionsRoot
  blockData.receiptTrie = blockData.receiptsRoot
  blockData.bloom = blockData.logsBloom
  const blockHeader = blockFromRpc(blockData)
  return utils.rlp.encode(blockHeader.header.raw)
}

class Eth2HmyRelay {
  initialize() {
    let ethNodeURL = "wss://ropsten.infura.io/ws/v3/03f8907457e847d7b14aa072355c8d03"
    //let ethNodeURL = "http://localhost:9545"
    // @ts-ignore
    this.robustWeb3 = new RobustWeb3(ethNodeURL)
    this.web3 = this.robustWeb3.web3
    this.hmyClient = new Harmony(
      // let's assume we deploy smart contract to this end-point URL
      "https://api.s0.b.hmny.io",
      {
        chainType: ChainType.Harmony,
        chainId: ChainID.HmyTestnet,
      }
    );

    const clientJson = require("../elc/ethClient/build/contracts/Client.json");
    const ethClientAddr = "0x4a7f0a457f077f7d4dcc249935308e50924e1981" //await deploy_contract(json) in elc/ethClient/test/deploy.js
    this.ethClientContract = this.hmyClient.contracts.createContract(

      clientJson.abi,
      ethClientAddr
      );
    this.ethClientContract.wallet.addByPrivateKey("3054d9107ed6900390d0de14fee63d1ac0f430f5e89a954a2b255a5fff639575"); 
    console.log("eth to hmy relayer initialised")
    
  }

  async run() {
    const options = { gasPrice: 1000000000, gasLimit: 6721900 };

    while (true) {
      let clientBlockNumber
      let chainBlockNumber
      try {
        
        // Even retry 10 times ethClientContract.getBlockHeightMax() could still fail
        // Return back to loop to avoid crash eth2hmy-relay.

        const maxHeight = await this.ethClientContract.methods.getBlockHeightMax().call(options);
        clientBlockNumber = parseInt(maxHeight)
        console.log(" EthClientContract block Number on Harmony Chain: "+ clientBlockNumber)
            
        chainBlockNumber = await this.robustWeb3.getBlockNumber()
        console.log(' Ethereum Chain block number is ' + chainBlockNumber)
      } catch (e) {
        console.log(e)
        continue
      }

      // // Backtrack if chain switched the fork.
      // while (true) {
      //   try {
      //     const chainBlock = await robustWeb3.getBlock(clientBlockNumber)
      //     const chainBlockHash = chainBlock.hash
      //     const clientHashes = await this.ethClientContract.known_hashes(
      //       clientBlockNumber
      //     )
      //     if (clientHashes.find((x) => x === chainBlockHash)) {
      //       break
      //     } else {
      //       console.log(
      //         `Block ${chainBlockHash} height: ${clientBlockNumber} is not known to the client. Backtracking.`
      //       )
      //       clientBlockNumber -= 1
      //     }
      //   } catch (e) {
      //     console.log(e)
      //     continue
      //   }
      // }
      console.log()

      if (clientBlockNumber < chainBlockNumber) {
        try {
          // Submit add_block txns
          let blockPromises = []
          let endBlock = Math.min(
            clientBlockNumber + MAX_SUBMIT_BLOCK,
            chainBlockNumber
          )
          if (clientBlockNumber < 5) {
            // Initially, do not add block concurrently
            endBlock = clientBlockNumber + 1
          }
 
          for (let i = clientBlockNumber + 1; i <= endBlock; i++) {                            
              var nextBlock = await this.robustWeb3.getBlock(i);     
              const nextBlockHex = encodeBlock(nextBlock)
      
              const response = await this.ethClientContract.methods.addBlockHeader(nextBlockHex).send(options);
              if (response.transaction.receipt != null && response.transaction.receipt.status == "0x1") {
                
                console.log("EthClientContract call successful, block_header added: "+ i)
              } else {
                console.log("EthClientContract call failed to add block_header: "+ i)      
              }           
          }
          console.log(
            `Successfully added block_headers ${clientBlockNumber + 1} to block ${endBlock}`
          )      

        } catch (e) {
          console.log(e)
        }
      } else {
        await sleep(10000)
      }
    }
  }

  //eth2near
  async getParseBlock(blockNumber) {
    try {
      const blockRlp = this.web3.utils.bytesToHex(
        web3BlockToRlp(await this.robustWeb3.getBlock(blockNumber))
      )
      // console.log(blockRlp)
      const unparsedBlock = await execute(
        `${BRIDGE_SRC_DIR}/vendor/ethashproof/cmd/relayer/relayer ${blockRlp} | sed -e '1,/Json output/d'`
      )
      console.log('---')
      console.log(unparsedBlock)
      const json =  JSON.parse(unparsedBlock)
      console.log(json) 
      return json   
    } catch (e) {
      console.log(`Failed to get or parse block ${blockNumber}: ${e}`)
    }
  }

  // eth2near 
  // need to use the below code eventually to extract merkle proofs , dag entries and send
  // along with block_header info for verifying block_headers on harmony_chain(validating block's POW)
  // this.submitBlock(getParseBlock(blockNumber))
  async submitBlock(block, blockNumber) {
    const h512s = block.elements
      .filter((_, index) => index % 2 === 0)
      .map((element, index) => {
        return (
          this.web3.utils.padLeft(element, 64) +
          this.web3.utils.padLeft(block.elements[index * 2 + 1], 64).substr(2)
        )
      })

    const args = {
      block_header: this.web3.utils.hexToBytes(block.header_rlp),
      dag_nodes: h512s
        .filter((_, index) => index % 2 === 0)
        .map((element, index) => {
          return {
            dag_nodes: [element, h512s[index * 2 + 1]],
            proof: block.merkle_proofs
              .slice(
                index * block.proof_length,
                (index + 1) * block.proof_length
              )
              .map((leaf) => this.web3.utils.padLeft(leaf, 32)),
          }
        }),
    }

    console.log(`Submitting block ${blockNumber} to EthClient`)
    return await this.ethClientContract.add_block_header_async(
      args,
      new BN('300000000000000')
    )
  }
}

exports.Eth2HmyRelay = Eth2HmyRelay
exports.execute = execute
exports.web3BlockToRlp = web3BlockToRlp
