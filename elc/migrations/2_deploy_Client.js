const Prime = artifacts.require("Prime");
const Client = artifacts.require("Client");
const Keccak512 = artifacts.require("Keccak512");
const MerkleProof = artifacts.require("MerkleProof");
const { getBlockByNumber } = require("../lib/getBlockHeader.js");
const yargs = require('yargs');
const argv = yargs.option('block', {
  alias: 'b',
  description: 'block to initialize',
  type: 'number',
}).option('ethurl', {
  description: 'Ethereum RPC URL',
  type: 'string',
}).env()
.help()
.alias('help', 'h').argv;

const EthUrl=argv.ethurl;
const BlockNo = argv.block || 11610000;

module.exports = async function(deployer) {
  await deployer.deploy(Prime);
  await deployer.deploy(Keccak512);
  await deployer.deploy(MerkleProof);
  const primeSol = await Prime.deployed();
  Client.link('Prime', primeSol.address);
  const keccak512Sol = await Keccak512.deployed();
  Client.link('Keccak512', keccak512Sol.address);
  const merkelSol = await MerkleProof.deployed();
  Client.link('MerkleProof', merkelSol.address);
  const initHeader = await getBlockByNumber(EthUrl, BlockNo);
  await deployer.deploy(Client, initHeader.serialize());
};
