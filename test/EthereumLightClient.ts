import { expect } from 'chai'
import { ethers, network } from 'hardhat'
import { getBlockByNumber } from '../src/eth2hmy-relay/lib/getBlockHeader'

// Constants Definition

describe('EthereumLightClient', function () {
    before(async function (this) {
        [this.deployer, this.relayer, this.alice, this.bob, this.currentTestcarol] = await ethers.getSigners()
        this.EthereumLightClient = await ethers.getContractFactory('EthereumLightClient')
    })
    beforeEach(async function (this) {
        this.snapshotId = await ethers.provider.send('evm_snapshot', [])
        const url = process.env.HARDHAT_URL
        const blockNum = 0
        // const blockNum = 27625582
        const initHeader = await getBlockByNumber(url, blockNum)
        const rlpHeader = initHeader.serialize()
        const EthereumLightClient = await ethers.getContractFactory('EthereumLightClient')
        this.ethereumLightClient = await EthereumLightClient.deploy()
        await this.ethereumLightClient.deployed()
        // console.log('EthereumLightClient deployed to:', this.ethereumLightClient.address)
        const tx = await this.ethereumLightClient.initialize(rlpHeader)
        await ethers.provider.waitForTransaction(tx.hash)
    // const receipt = await ethers.provider.waitForTransaction(tx.hash)
    // console.log(`receipt: ${JSON.stringify(receipt)}`)
    })

    afterEach(async function (this) {
    // console.log(`Reverting Snapshot : ${snapshotId}`);
        await network.provider.send('evm_revert', [this.snapshotId])
    })

    describe('EthereumLightClient Tests', function (this) {
        it('EthereumLightClient-1 view functions should work', async function () {
            expect(await this.ethereumLightClient.blockHeightMax()).to.equal(0)
            expect(await this.ethereumLightClient.finalityConfirms()).to.equal(0)
            expect(await this.ethereumLightClient.firstBlock()).to.equal(0)
            expect(await this.ethereumLightClient.getBlockHeightMax()).to.equal(0)
        })
        // Test all update functions by calling them and checking variables and events after calls
        // For event testing logic see this example repo https://github.com/fvictorio/hardhat-examples/tree/master/reading-events
        it('EthereumLightClient-2 update functions should work', async function () {
            // "function addBlockHeader(bytes,bytes32[4][64],bytes32[][64]) returns (bool)",
        })
        it('EthereumLightClient-3 reverts should work for negative use cases', async function () {
        })
        it('EthereumLightClient-4 complex tests should work', async function () {
        })
    })
})

/* List of functiona and events to test from data/abi/EthereumLightClient.json"
  "event Initialized(uint8)",
  "event Paused(address)",
  "event Unpaused(address)",
  "function VerifyReceiptsHash(bytes32,bytes32) view returns (bool)",
  "function addBlockHeader(bytes,bytes32[4][64],bytes32[][64]) returns (bool)",
  "function blockExisting(uint256) view returns (bool)",
  "function blockHeightMax() view returns (uint256)",
  "function blocks(uint256) view returns (uint256, uint256, uint256, uint256, uint256, uint256, uint256, uint256)",
  "function blocksByHeight(uint256,uint256) view returns (uint256)",
  "function blocksByHeightExisting(uint256) view returns (bool)",
  "function finalityConfirms() view returns (uint256)",
  "function finalizedBlocks(uint256) view returns (bool)",
  "function firstBlock() view returns (uint256)",
  "function getBlockHeightMax() view returns (uint256)",
  "function getReceiptRoot(bytes32) view returns (bytes32)",
  "function getStateRoot(bytes32) view returns (bytes32)",
  "function getTxRoot(bytes32) view returns (bytes32)",
  "function initialize(bytes)",
  "function longestBranchHead(uint256) view returns (uint256)",
  "function paused() view returns (bool)",
  "function verifiedBlocks(uint256) view returns (bool)",
  "function verifyEthash(bytes32,uint64,uint64,bytes32[4][64],bytes32[][64],uint256,uint256) pure returns (bool)"
  */
