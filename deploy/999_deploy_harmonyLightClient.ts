/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { toRLPHeader } from '../src/lib/utils'

const config = require('../config.js')

async function fetchBlock (blockNumber) {
    const provider = new ethers.providers.JsonRpcProvider(
        config.hmyURL
    )
    return await provider.send('hmyv2_getFullHeader', [blockNumber])
}

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    // const initialBlock = '0xe'
    const initialBlock = 1
    const response = await fetchBlock(initialBlock)
    const initialBlockRlp = toRLPHeader(response)
    const relayers = ['0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016']
    const threshold = 1

    const HarmonyLightClient = await deploy('HarmonyLightClient', {
        from: deployer,
        args: [],
        proxy: false,
        log: true,
        autoMine: true // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })

    const harmonyLightClient = await ethers.getContractAt('HarmonyLightClient', HarmonyLightClient.address)

    console.log('HarmonyLightClient deployed to:', harmonyLightClient.address)
    const tx = await harmonyLightClient.initialize(initialBlockRlp, relayers, threshold)
    await ethers.provider.waitForTransaction(tx.hash)

    console.log(`DEFAULT_ADMIN_ROLE   : ${await harmonyLightClient.DEFAULT_ADMIN_ROLE()}`)
    console.log(`RELAYER_ROLE         : ${await harmonyLightClient.RELAYER_ROLE()}`)
    console.log(`paused               : ${await harmonyLightClient.paused()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['TEST']
export default deployFunction
