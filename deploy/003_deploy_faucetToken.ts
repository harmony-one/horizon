/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, upgrades } from 'hardhat'

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    const FaucetToken = await ethers.getContractFactory('FaucetToken')
    console.log('Deploying FaucetToken...')
    const faucetToken = await upgrades.deployProxy(FaucetToken, ['EthHorizonFaucetToken', 'EHFT', '1000000'], { initializer: 'initialize' })
    await faucetToken.deployed()
    console.log('FaucetToken deployed to:', faucetToken.address)

    // const FaucetToken = await deploy('FaucetToken', {
    //     from: deployer,
    //     args: [],
    //     proxy: false,
    //     log: true,
    //     autoMine: true // speed up deployment on local network (ganache, hardhat), no effect on live networks
    // })

    // const faucetToken = await ethers.getContractAt('FaucetToken', FaucetToken.address)

    // console.log('FaucetToken deployed to:', faucetToken.address)
    // const tx = await faucetToken.initialize('EthHorizonFaucetToken', 'EHFT', '1000000')
    // await ethers.provider.waitForTransaction(tx.hash)
    // // tx = await faucetToken.mint(1000000)
    // // await ethers.provider.waitForTransaction(tx.hash)

    console.log(`name        : ${await faucetToken.name()}`)
    console.log(`symbol      : ${await faucetToken.symbol()}`)
    console.log(`decimals    : ${await faucetToken.decimals()}`)
    console.log(`totalSupply : ${await faucetToken.totalSupply()}`)
}

deployFunction.dependencies = []
deployFunction.tags = [
    'ETHFaucetToken',
    'Ethereum'
]
export default deployFunction
