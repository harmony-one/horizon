/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const FaucetToken = await deploy('FaucetToken', {
    from: deployer,
    args: [],
    proxy: false,
    log: true,
    autoMine: true // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  const faucetToken = await ethers.getContractAt('FaucetToken', FaucetToken.address)

  console.log('FaucetToken deployed to:', faucetToken.address)
  const tx = await faucetToken.initialize('EthHorizonFaucetToken', 'EHFT')
  await ethers.provider.waitForTransaction(tx.hash)

  console.log(`name        : ${await faucetToken.name()}`)
  console.log(`symbol      : ${await faucetToken.symbol()}`)
  console.log(`decimals    : ${await faucetToken.decimals()}`)
  console.log(`totalSupply : ${await faucetToken.totalSupply()}`)
}

deployFunction.dependencies = []
deployFunction.tags = [
  'EthFaucetToken',
  'Ethereum',
  'hardhat',
  'Test'
]
export default deployFunction
