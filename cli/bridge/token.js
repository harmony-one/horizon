
const ERC20Sol = require("../../bridge/build/contracts/ERC20.json");
const FaucetToken = require("../../bridge/build/contracts/FaucetToken.json");

class ERC20 {
    constructor(web3, tokenAddress) {
        this.web3 = web3;
        this.contract = web3.ContractAt(ERC20Sol.abi, tokenAddress);
    }

    name() {
        return this.contract.methods.name().call();
    }

    symbol() {
        return this.contract.methods.symbol().call();
    }

    decimals() {
        return this.contract.methods.decimals().call();
    }

    balanceOf(user) {
        return this.contract.methods.balanceOf(user).call();
    }

    allowance(owner, spender) {
        return this.contract.methods.allowance(owner, spender).call();
    }

    approve(spender, amount) {
        const tx = this.contract.methods.approve(spender, amount);
        return this.web3.sendTx(tx);
    }

    transfer(to, amount) {
        const tx = this.contract.methods.transfer(to, amount);
        return this.web3.sendTx(tx);
    }

    transferFrom(from, to, amount) {
        const tx = this.contract.methods.transferFrom(from, to, amount);
        return this.web3.sendTx(tx);
    }
}

class FaucetERC20 extends ERC20 {
    constructor(web3, address) {
        super(web3, address);
        this.contract = web3.ContractAt(FaucetToken.abi, address);
    }
    mint() {
        const tx = this.contract.methods.mint();
        return this.web3.sendTx(tx);
    }

    static async deploy(web3) {
        const tx = web3.ContractDeploy(FaucetToken.abi, FaucetToken.bytecode, ["Faucet", "Facuet", 18]);
        const contract = await web3.sendTx(tx);
        return new FaucetERC20(web3, contract.options.address);
    }
}

module.exports = {ERC20, FaucetERC20}