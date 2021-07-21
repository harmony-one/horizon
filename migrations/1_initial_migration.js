const Migrations = artifacts.require("Migrations");
const Client = artifacts.require("Client");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Client);
};