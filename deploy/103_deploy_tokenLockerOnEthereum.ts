/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, upgrades } from 'hardhat'

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, log, get } = deployments

    const TokenLockerOnEthereum = await ethers.getContractFactory('TokenLockerOnEthereum')
    const tokenLockerOnEthereum = await upgrades.deployProxy(
        TokenLockerOnEthereum,
        [],
        { initializer: 'initialize', unsafeAllow: ['external-library-linking'] }
    )

    await tokenLockerOnEthereum.deployed()

    console.log('TokenLockerOnEthereum deployed to:', tokenLockerOnEthereum.address)

    // Currently have to manuall configure the lightCient
    // // get the Harmony light client
    // const HarmonyLightClient = await get('HarmonyLightClient')
    // // const harmonyLightClient = await ethers.getContractAt('HarmonyLightClient', HarmonyLightClient.address)
    // console.log(`harmonyLightClient.address: ${HarmonyLightClient.address}`)
    // const tx = await tokenLockerOnEthereum.changeLightClient(HarmonyLightClient.address)
    const tx = await tokenLockerOnEthereum.changeLightClient('0x3Ceb74A902dc5fc11cF6337F68d04cB834AE6A22')
    await ethers.provider.waitForTransaction(tx.hash)

    console.log(`lightclient   : ${await tokenLockerOnEthereum.lightclient()}`)
    console.log(`owner         : ${await tokenLockerOnEthereum.owner()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['TokenLockerOnEthereum']
export default deployFunction
