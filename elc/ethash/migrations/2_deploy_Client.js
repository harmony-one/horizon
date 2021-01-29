const Prime = artifacts.require("Prime");
const Client = artifacts.require("Client");
const Keccak512 = artifacts.require("Keccak512");
const MerkleProof = artifacts.require("MerkleProof");
const { getBlockByNumber } = require("../lib/getBlockHeader.js");

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
  const initHeader = await getBlockByNumber(11601333);
  await deployer.deploy(Client, initHeader.serialize());
};
