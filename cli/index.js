const { program } = require('commander');
const { genearateDagMTreeRange } = require('./ethashProof/DagMtreeEpoch');
const { getHeaderProof, parseRlpHeader, getBlock } = require('./ethashProof/BlockProof');
const { blockRelayLoop } = require('./eth2hmy-relay/elcRelay');
const { deployELC, statsuELC } = require('./elc/elcContract');
const { merkelRootSol } = require('./ethashProof/MerkelRootSol');
const { EProve } = require('../eprover');
const { deployEVerifier, MPTProof } = require('./everifier/contract');
const fs = require('fs');

program.description("Horizon Trustless Bridge CLI");

const Dag_CMD = program.command('dagProve').description('DAG Merkel Tree cli');
Dag_CMD
  .command('generate <epoch_start>')
  .description('generate cache merkle tree for epochs [start, start+num)')
  .option('-n,--num <number>', 'number of epoch processed', 1)
  .option('-d,--dagDir <dag dir>', 'direction to store dag merkel tree', './.dag')
  .option('-t,--type <output type>', 'output type: sol,json', 'sol')
  .option('-o,--output <OUTPUT>', 'output file')
  .action((start, options) => {
      start = Number(start);
      const dagMTrees = genearateDagMTreeRange(options.dagDir, start, options.num);
      const outJson = {
        epoch: start,
        roots: dagMTrees.map(dmt=>dmt.merkel.getRoot().toString('hex'))
      };
      const out = options.type == 'json' ? outJson : merkelRootSol(outJson);
      if(!options.output){
        console.log(out);
      }else{
        const ostr = options.type == 'json' ? JSON.stringify(out):out
        fs.writeFileSync(options.output, ostr);
      }
  });

Dag_CMD
  .command('blockProof')
  .description('get block proof data')
  .option('-u,--url <eth url>', 'ethereum node RPC url')
  .option('-b,--block <number/hash>', 'block number or hash')
  .option('-H --header <rlpBlockHeader>', 'hexadecimal string of rlp block header')
  .option('-d,--dagDir <dag dir>', 'direction to store dag merkel tree', './.dag')
  .option('-o,--output <OUTPUT>', 'output file')
  .action(async (options) => {
    let header;
    if(options.block){
      header = await getBlock(options.url, options.block);
    }else{
      const rlpHeader = Buffer.from(options.header, 'hex');
      header = parseRlpHeader(rlpHeader);
    }
    const proofs = getHeaderProof(options.dagDir, header);

    const _toHex = e=>`0x${e.toString('hex')}`;
    const proofJson = {
        header_rlp: _toHex(header.serialize()),
        merkle_root: _toHex(proofs.root),
        elements: proofs.dagData.map(elems=>elems.map(_toHex)),
        merkle_proofs: proofs.proofs.map(_toHex),
        proofIndexes: proofs.proofIndexes.map(_toHex),
    }
    if(!options.output){
      console.log(proofJson);
    }else{
      fs.writeFileSync(options.output, JSON.stringify(proofJson));
    }
  });

const ETHRelay_CMD = program.command('ethRelay').description('ethereum block relay cli');
ETHRelay_CMD
.command('getBlockHeader <ethUrl> <number/hash>')
.description('get block header')
.option('-t --type <output format>', 'output format: json/rlp', 'json')
.action(async (url, block, options) => {
  const header = await getBlock(url, block);
  if(options.type == 'rlp')
    console.log(header.serialize().toString('hex'));
  else
    console.log(header.toJSON());
});

ETHRelay_CMD
.command('relay <ethUrl> <hmyUrl> <elcAddress>')
.description('relay eth block header to elc on hmy')
.option('-d,--dagDir <dag dir>', 'direction to store dag merkel tree', './.dag')
.action(async (ethUrl, hmyUrl, elcAddress, options) => {
  await blockRelayLoop(options.dagDir, ethUrl, hmyUrl, elcAddress);
});

const CMD_ELC = program.command('ELC').description('ethereum ligth client cli')
CMD_ELC
.command('deploy <hmyUrl>')
.description('deploy ELC contract on hmy')
.option('-u,--url <eth url>', 'ethereum node RPC url')
.option('-b,--block <number/hash>', 'init block number or hash')
.option('-H --header <rlpBlockHeader>', 'hexadecimal string of rlp block header')
.action(async (hmyUrl, options) => {
  let header;
  if(options.block){
    header = await getBlock(options.url, options.block);
  }else{
    const rlpHeader = Buffer.from(options.header, 'hex');
    header = parseRlpHeader(rlpHeader);
  }
  const ELC = await deployELC(hmyUrl, header.serialize());
  console.log("ELC:", ELC.options.address);
});

CMD_ELC
.command('status <hmyUrl> <ELC_address>')
.description('relay eth block header to elc on hmy')
.action(async (hmyUrl, elcAddress) => {
  await statsuELC(hmyUrl, elcAddress);
});

const CMD_EProve = program.command('EProve').description('ethereum receipt prove cli')

CMD_EProve
.command('proof <ethUrl> <tx_hash>')
.description('get receipt proof of a transaction from ethereum')
.option('-o,--output <OUTPUT>', 'output file')
.action(async (ethUrl, txHash, options) => {
  const ep = new EProve(ethUrl);
  const proof = await ep.receiptProof(txHash);
  const keys = Object.keys(proof);
  const out = {};
  keys.forEach(key => out[key] = '0x'+proof[key].toString('hex'));
  if(options.output){
    fs.writeFileSync(options.output, JSON.stringify(out));
  }else{
    console.log(out);
  }
});


const CMD_EVerifier = program.command('EVerifier').description('ethereum receipt verify cli');

CMD_EVerifier
.command('verify <ethUrl> <tx_hash> <hmyUrl> <contract address>')
.description('verify receipt MPT proof vai everifier contract, return receipt')
.option('-o,--output <OUTPUT>', 'output file')
.option('-t --type <output format>', 'output format: json/rlp', 'json')
.action(async (ethUrl, txHash, hmyUrl, evAddress, options) => {
  const ep = new EProve(ethUrl);
  const proof = await ep.receiptProof(txHash);
  const receiptObj = await MPTProof(hmyUrl, evAddress, proof);
  const out = options.type == 'json' ? receiptObj.toJson() : receiptObj.toHex();
  if(options.output){
    fs.writeFileSync(options.output, out);
  }else{
    console.log(out);
  }
});

CMD_EVerifier
.command('deploy <hmyUrl>')
.description('deploy EVerifier library contract on hmy')
.action(async (hmyUrl) => {
  const contract = await deployEVerifier(hmyUrl);
  console.log("EVerifier:", contract.options.address);
});


program.parse(process.argv);