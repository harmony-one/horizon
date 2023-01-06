/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, upgrades } from 'hardhat'
import { getBlockByNumber } from '../src/eth2hmy-relay/lib/getBlockHeader'

const config = require('../config.js')

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const url = config.ethURL
    console.log(`config.ethURL: ${config.ethURL}`)
    const blockNum = config.elcInitialBlock // Localgeth Block Number
    console.log(`blockNum: ${blockNum}`)
    const initHeader = await getBlockByNumber(url, blockNum)
    const rlpHeader = initHeader.serialize()

    const EthereumLightClient = await ethers.getContractFactory('EthereumLightClient')
    const ethereumLightClient = await upgrades.deployProxy(
        EthereumLightClient,
        [rlpHeader],
        { initializer: 'initialize', unsafeAllow: ['external-library-linking'] }
    )

    await ethereumLightClient.deployed()
    console.log('EthereumLightClient deployed to:', ethereumLightClient.address)
    console.log(`blockHeightMax   : ${await ethereumLightClient.blockHeightMax()}`)
    console.log(`finalityConfirms : ${await ethereumLightClient.finalityConfirms()}`)
    console.log(`firstBlock       : ${await ethereumLightClient.firstBlock()}`)
    console.log(`getBlockHeightMax: ${await ethereumLightClient.getBlockHeightMax()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['EthereumLightClient']
export default deployFunction
