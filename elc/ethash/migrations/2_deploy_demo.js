const DemoContract = artifacts.require("Demo");

module.exports = function(deployer) {
  deployer.deploy(DemoContract, 123);
};
