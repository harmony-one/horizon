const ERC20Sol = require('../../build/@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol/ERC20Upgradeable.json')
const FaucetToken = require('../../build/contracts/FaucetToken.sol/FaucetToken.json')

class ERC20 {
    constructor (ethers, tokenAddress) {
        this.ethers = ethers
        this.erc20 = ethers.ContractAt(ERC20Sol.abi, tokenAddress)
    }

    name () {
        return this.erc20.name()
    }

    symbol () {
        return this.erc20.symbol()
    }

    decimals () {
        return this.erc20.decimals()
    }

    balanceOf (user) {
        return this.erc20.balanceOf(user)
    }

    allowance (owner, spender) {
        return this.erc20.allowance(owner, spender)
    }

    async approve (spender, amount) {
        const tx = this.erc20.approve(spender, amount)
        await tx.wait()
        return tx
    }

    async transfer (to, amount) {
        const tx = this.erc20.transfer(to, amount)
        await tx.wait()
        return tx
    }

    async transferFrom (from, to, amount) {
        const tx = this.erc20.transferFrom(from, to, amount)
        await tx.wait()
        return tx
    }
}

class FaucetERC20 extends ERC20 {
    constructor (ethers, address) {
        super(ethers, address)
        this.faucetToken = ethers.ContractAt(FaucetToken.abi, address)
    }

    async mint () {
        const tx = this.faucetToken.mint()
        await tx.wait()
        return tx
    }

    static async deploy (ethers) {
        const faucetToken = await ethers.ContractDeploy(FaucetToken.abi, FaucetToken.bytecode, [
            'Faucet',
            'Faucet',
            18
        ])
        return new FaucetERC20(ethers, faucetToken.address)
    }
}

module.exports = { ERC20, FaucetERC20 }
