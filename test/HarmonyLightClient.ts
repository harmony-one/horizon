import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { toRLPHeader } from '../src/lib/utils'

// Constants Definition

// Additional Functions
async function fetchBlock (blockNumber) {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.LOCALNET_URL
    )
    return await provider.send('hmyv2_getFullHeader', [blockNumber])
}

describe('HarmonyLightClient', function () {
    before(async function (this) {
        [this.deployer, this.relayer, this.alice, this.bob, this.currentTestcarol] = await ethers.getSigners()
        this.HarmonyLightClient = await ethers.getContractFactory('HarmonyLightClient')
    })
    beforeEach(async function (this) {
        this.snapshotId = await ethers.provider.send('evm_snapshot', [])
        // const initialBlock = '0xe'
        const initialBlock = 1
        const response = await fetchBlock(initialBlock)
        const initialBlockRlp = toRLPHeader(response)
        const relayers = ['0x0B585F8DaEfBC68a311FbD4cB20d9174aD174016']
        const threshold = 1

        const HarmonyLightClient = await ethers.getContractFactory('HarmonyLightClient')
        this.harmonyLightClient = await HarmonyLightClient.deploy()
        await this.harmonyLightClient.deployed()
        // console.log('HarmonyLightClient deployed to:', this.harmonyLightClient.address)
        const tx = await this.harmonyLightClient.initialize(initialBlockRlp, relayers, threshold)
        await ethers.provider.waitForTransaction(tx.hash)
    })

    afterEach(async function (this) {
    // console.log(`Reverting Snapshot : ${snapshotId}`);
        await network.provider.send('evm_revert', [this.snapshotId])
    })

    describe('HarmonyLightClient Tests', function (this) {
        it('HarmonyLightClient-1 view functions should work', async function () {
            expect(await this.harmonyLightClient.DEFAULT_ADMIN_ROLE()).to.equal('0x0000000000000000000000000000000000000000000000000000000000000000')
            expect(await this.harmonyLightClient.RELAYER_ROLE()).to.equal('0xe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc4')
            expect(await this.harmonyLightClient.paused()).to.equal(false)
        })
        // Test all update functions by calling them and checking variables and events after calls
        // For event testing logic see this example repo https://github.com/fvictorio/hardhat-examples/tree/master/reading-events
        it('HarmonyLightClient-2 update functions should work', async function () {
            // "function addBlockHeader(bytes,bytes32[4][64],bytes32[][64]) returns (bool)",
        })
        it('HarmonyLightClient-3 reverts should work for negative use cases', async function () {
        })
        it('HarmonyLightClient-4 complex tests should work', async function () {
        })
    })
})

/* List of functiona and events to test from data/abi/HarmonyLightClient.json"
  "event CheckPoint(bytes32,bytes32,bytes32,uint256,uint256,uint256,uint256,bytes32,bytes32)",
  "event Initialized(uint8)",
  "event Paused(address)",
  "event RelayerAdded(address)",
  "event RelayerRemoved(address)",
  "event RelayerThresholdChanged(uint256)",
  "event RoleAdminChanged(bytes32 indexed,bytes32 indexed,bytes32 indexed)",
  "event RoleGranted(bytes32 indexed,address indexed,address indexed)",
  "event RoleRevoked(bytes32 indexed,address indexed,address indexed)",
  "event Unpaused(address)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function RELAYER_ROLE() view returns (bytes32)",
  "function adminAddRelayer(address)",
  "function adminChangeRelayerThreshold(uint256)",
  "function adminPauseLightClient()",
  "function adminRemoveRelayer(address)",
  "function adminUnpauseLightClient()",
  "function getLatestCheckPoint(uint256,uint256) view returns (tuple(bytes32,bytes32,bytes32,bytes32,uint256,uint256,uint256,uint256,bytes32,bytes32))",
  "function getRoleAdmin(bytes32) view returns (bytes32)",
  "function grantRole(bytes32,address)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function initialize(bytes,address[],uint8)",
  "function isValidCheckPoint(uint256,bytes32) view returns (bool)",
  "function paused() view returns (bool)",
  "function renounceAdmin(address)",
  "function renounceRole(bytes32,address)",
  "function revokeRole(bytes32,address)",
  "function submitCheckpoint(bytes)",
  "function supportsInterface(bytes4) view returns (bool)"
  */
