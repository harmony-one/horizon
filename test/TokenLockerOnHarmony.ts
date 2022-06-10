import { expect } from 'chai'
import { ethers, network } from 'hardhat'

// Constants Definition

describe('TokenLockerOnHarmony', function () {
    before(async function (this) {
        [this.deployer, this.relayer, this.alice, this.bob, this.currentTestcarol] = await ethers.getSigners()
        this.TokenLockerOnHarmony = await ethers.getContractFactory('TokenLockerOnHarmony')
    })
    beforeEach(async function (this) {
        this.snapshotId = await ethers.provider.send('evm_snapshot', [])
        const TokenLockerOnHarmony = await ethers.getContractFactory('TokenLockerOnHarmony')
        this.tokenLockerOnHarmony = await TokenLockerOnHarmony.deploy()
        await this.tokenLockerOnHarmony.deployed()
        // console.log('TokenLockerOnHarmony deployed to:', this.tokenLockerOnHarmony.address)
        const tx = await this.tokenLockerOnHarmony.initialize()
        await ethers.provider.waitForTransaction(tx.hash)
    // const receipt = await ethers.provider.waitForTransaction(tx.hash)
    // console.log(`receipt: ${JSON.stringify(receipt)}`)
    })

    afterEach(async function (this) {
    // console.log(`Reverting Snapshot : ${snapshotId}`);
        await network.provider.send('evm_revert', [this.snapshotId])
    })

    describe('TokenLockerOnHarmony Tests', function (this) {
        it('TokenLockerOnHarmony-1 view functions should work', async function () {
            expect(await this.tokenLockerOnHarmony.lightclient()).to.equal('0x0000000000000000000000000000000000000000')
            expect(await this.tokenLockerOnHarmony.owner()).to.equal('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
        })
        // Test all update functions by calling them and checking variables and events after calls
        // For event testing logic see this example repo https://github.com/fvictorio/hardhat-examples/tree/master/reading-events
        it('TokenLockerOnHarmony-2 update functions should work', async function () {
            // "function addBlockHeader(bytes,bytes32[4][64],bytes32[][64]) returns (bool)",
        })
        it('TokenLockerOnHarmony-3 reverts should work for negative use cases', async function () {
        })
        it('TokenLockerOnHarmony-4 complex tests should work', async function () {
        })
    })
})

/* List of functiona and events to test from data/abi/TokenLockerOnHarmony.json"
  "event Burn(address indexed,address indexed,uint256,address)",
  "event Initialized(uint8)",
  "event Locked(address indexed,address indexed,uint256,address)",
  "event OwnershipTransferred(address indexed,address indexed)",
  "event TokenMapAck(address indexed,address indexed)",
  "event TokenMapReq(address indexed,uint8 indexed,string,string)",
  "function RxMapped(address) view returns (address)",
  "function RxMappedInv(address) view returns (address)",
  "function RxTokens(uint256) view returns (address)",
  "function TxMapped(address) view returns (address)",
  "function TxMappedInv(address) view returns (address)",
  "function TxTokens(uint256) view returns (address)",
  "function bind(address)",
  "function changeLightClient(address)",
  "function initialize()",
  "function issueTokenMapReq(address)",
  "function lightclient() view returns (address)",
  "function lock(address,address,uint256)",
  "function otherSideBridge() view returns (address)",
  "function owner() view returns (address)",
  "function renounceOwnership()",
  "function spentReceipt(bytes32) view returns (bool)",
  "function totalBridgedTokens() view returns (uint256, uint256)",
  "function transferOwnership(address)",
  "function unlock(address,address,uint256)",
  "function validateAndExecuteProof(uint256,bytes32,bytes,bytes)"
*/
