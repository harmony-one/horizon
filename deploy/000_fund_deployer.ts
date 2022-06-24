import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const config = require('../config.js')

// Fund deployer acounts for local networks localgeth and localnet
const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { getNamedAccounts, getChainId } = hre
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    console.log(`chainId: ${chainId}`)
    let funder
    switch (chainId) {
    // localgeth
    case '8788':{
        funder = new ethers.Wallet(config.localgethPrivateKey, ethers.provider)
        break
    }
    // localnet
    case '1666700000': {
        funder = new ethers.Wallet(config.localnetPrivateKey, ethers.provider)
        break
    }
    // hardhatNode
    case '31337': {
        funder = new ethers.Wallet(config.hardhatPrivateKey, ethers.provider)
        break
    }
    }
    if (funder !== undefined) {
        const tx = await funder.sendTransaction({
            to: deployer,
            value: ethers.utils.parseEther('100')
        })
        await ethers.provider.waitForTransaction(tx.hash)
    }
    const balance = await ethers.provider.getBalance(deployer)
    console.log(`deployer: ${deployer}, balance: ${ethers.utils.formatEther(balance)}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['Funding', 'Ethereum', 'Harmony']
export default deployFunction
