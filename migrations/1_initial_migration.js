const Migrations = artifacts.require("Migrations");
const Prover = artifacts.require("HarmonyProver");
const MMRVerifier = artifacts.require("MMRVerifier");

module.exports = async function(deployer) {
  deployer.deploy(Migrations);
  const verifier = await deployer.deploy(MMRVerifier);
  await Prover.link('MMRVerifier', verifier);
};