/* eslint-disable node/no-unpublished-import */
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers, upgrades } from 'hardhat'

const deployFunction: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    // const { deployments, getNamedAccounts } = hre
    // const { deploy, log, get } = deployments
    // const { deployer } = await getNamedAccounts()

    const TokenLockerOnHarmony = await ethers.getContractFactory('TokenLockerOnHarmony')
    const tokenLockerOnHarmony = await upgrades.deployProxy(
        TokenLockerOnHarmony,
        [],
        { initializer: 'initialize', unsafeAllow: ['external-library-linking'] }
    )

    await tokenLockerOnHarmony.deployed()

    console.log('TokenLockerOnEthereum deployed to:', tokenLockerOnHarmony.address)

    // // get the Ethereum light client
    // const EthreumLightClient = await get('EthereumLightClient')
    // console.log(`EthreumLightClient.address: ${EthreumLightClient.address}`)
    // tx = await tokenLockerOnHarmony.changeLightClient(EthreumLightClient.address)
    // await ethers.provider.waitForTransaction(tx.hash)

    console.log(`lightclient   : ${await tokenLockerOnHarmony.lightclient()}`)
    console.log(`owner         : ${await tokenLockerOnHarmony.owner()}`)
}

deployFunction.dependencies = ['EthereumLightClient']
deployFunction.tags = ['TokenLockerOnHarmony']
export default deployFunction
