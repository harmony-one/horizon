//var provider = new Web3.providers.HttpProvider("http://localhost:8545");
const Contract = require("@truffle/contract");

// options:{web3,provider}
function ContractAt(abi, address, options) {
    const contract = Contract({abi});
    const provider = options && (options.provider || (options.web3 && options.web3._provider));
    contract.setProvider(provider);
    return contract.at(address);
}

function ContractDeploy(abi, params, options) {
    const contract = Contract({abi});
    const provider = options && (options.provider || (options.web3 && options.web3._provider));
    contract.setProvider(provider);
    return contract.new(...params);
}

module.exports = {ContractAt};