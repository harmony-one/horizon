/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts } = hre
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()

    const TokenLockerOnEthereum = await deploy('TokenLockerOnEthereum', {
        from: deployer,
        args: [],
        proxy: false,
        log: true,
        autoMine: true // speed up deployment on local network (ganache, hardhat), no effect on live networks
    })

    const tokenLockerOnEthereum = await ethers.getContractAt('TokenLockerOnEthereum', TokenLockerOnEthereum.address)

    console.log('TokenLockerOnEthereum deployed to:', tokenLockerOnEthereum.address)
    let tx = await tokenLockerOnEthereum.initialize()
    await ethers.provider.waitForTransaction(tx.hash)

    // get the Harmony light client
    const HarmonyLightClient = await get('HarmonyLightClient')
    // const harmonyLightClient = await ethers.getContractAt('HarmonyLightClient', HarmonyLightClient.address)
    console.log(`harmonyLightClient.address: ${HarmonyLightClient.address}`)
    tx = await tokenLockerOnEthereum.changeLightClient(HarmonyLightClient.address)
    await ethers.provider.waitForTransaction(tx.hash)

    console.log(`lightclient   : ${await tokenLockerOnEthereum.lightclient()}`)
    console.log(`owner         : ${await tokenLockerOnEthereum.owner()}`)
}

deployFunction.dependencies = []
deployFunction.tags = ['TokenLockerOnEthereum', 'Ethereum', 'Production']
export default deployFunction
