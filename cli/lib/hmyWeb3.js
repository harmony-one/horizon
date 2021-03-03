const Web3 = require('web3');

class HmyWeb3 {
    web3;address;
    constructor(url, prikey=process.env.PRIKEY) {
        this.web3 = new Web3(url);
        this.addPrivateKey(prikey);
    }
    ContractAt(abi, address) {
        const contract = new this.web3.eth.Contract(abi, address, {from:this.address});
        contract.handleRevert = true; // https://web3js.readthedocs.io/en/v1.3.4/web3-eth-contract.html#handlerevert
        return contract;
    }
    ContractDeploy(abi, code, _arguments) {
        return this.ContractAt(abi).deploy({
            data:code, 
            arguments:_arguments
        });
    }
    async sendTx(tx, gas) {
        if(!gas){
            gas = await tx.estimateGas();
        }
        return tx.send({gas})
    }
    addPrivateKey(prikey) {
        const acc = this.web3.eth.accounts.privateKeyToAccount(prikey);
        this.web3.eth.accounts.wallet.add(acc);
        this.address = acc.address;
    }
}


module.exports = {HmyWeb3}