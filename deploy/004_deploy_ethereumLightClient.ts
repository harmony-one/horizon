/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { getBlockByNumber } from '../src/eth2hmy-relay/lib/getBlockHeader'

const deployFunction: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { deployments, getNamedAccounts } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const url = process.env.ETH_NODE_URL
  const blockNum = 0
  // const blockNum = 27625582
  const initHeader = await getBlockByNumber(url, blockNum)
  const rlpHeader = initHeader.serialize()
  const EthereumLightClient = await deploy('EthereumLightClient', {
    from: deployer,
    args: [],
    proxy: false,
    log: true,
    autoMine: true // speed up deployment on local network (ganache, hardhat), no effect on live networks
  })

  const ethereumLightClient = await ethers.getContractAt('EthereumLightClient', EthereumLightClient.address)

  console.log('EthereumLightClient deployed to:', ethereumLightClient.address)
  const tx = await ethereumLightClient.initialize(rlpHeader)
  await ethers.provider.waitForTransaction(tx.hash)
  console.log(`blockHeightMax   : ${await ethereumLightClient.blockHeightMax()}`)
  console.log(`finalityConfirms : ${await ethereumLightClient.finalityConfirms()}`)
  console.log(`firstBlock       : ${await ethereumLightClient.firstBlock()}`)
  console.log(`getBlockHeightMax: ${await ethereumLightClient.getBlockHeightMax()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['EthereumLightClient', 'Harmony', 'localnet']
export default deployFunction
