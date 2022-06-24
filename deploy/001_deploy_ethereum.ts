/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, upgrades } from 'hardhat'
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
    // const initialBlock = '0xe'
    const initialBlock = config.hlcInitialBlock
    const response = await fetchBlock(initialBlock)
    const initialBlockRlp = toRLPHeader(response)
    const relayers = config.relayers
    const threshold = config.threshold

    const HarmonyLightClient = await ethers.getContractFactory('HarmonyLightClient')
    const harmonyLightClient = await upgrades.deployProxy(
        HarmonyLightClient,
        [initialBlockRlp, relayers, threshold],
        { initializer: 'initialize' }
        // { initializer: 'initialize', unsafeAllow: ['external-library-linking'] }
    )

    await harmonyLightClient.deployed()

    console.log('HarmonyLightClient deployed to:', harmonyLightClient.address)
    console.log(`DEFAULT_ADMIN_ROLE   : ${await harmonyLightClient.DEFAULT_ADMIN_ROLE()}`)
    console.log(`RELAYER_ROLE         : ${await harmonyLightClient.RELAYER_ROLE()}`)
    console.log(`paused               : ${await harmonyLightClient.paused()}`)
    console.log(`oldestEpochStored    : ${await harmonyLightClient.oldestEpochStored()}`)
    const TokenLockerOnEthereum = await ethers.getContractFactory('TokenLockerOnEthereum')
    const tokenLockerOnEthereum = await upgrades.deployProxy(
        TokenLockerOnEthereum,
        [],
        { initializer: 'initialize', unsafeAllow: ['external-library-linking'] }
    )

    await tokenLockerOnEthereum.deployed()
    console.log('TokenLockerOnEthereum deployed to:', tokenLockerOnEthereum.address)
    const tx = await tokenLockerOnEthereum.changeLightClient(harmonyLightClient.address)
    await ethers.provider.waitForTransaction(tx.hash)

    console.log(`lightclient   : ${await tokenLockerOnEthereum.lightclient()}`)
    console.log(`owner         : ${await tokenLockerOnEthereum.owner()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['Ethereum', 'Production']
export default deployFunction
