import { expect } from 'chai'
import { ethers, network } from 'hardhat'

// Constants Definition

describe('FaucetToken', function () {
    before(async function (this) {
        [this.deployer, this.relayer, this.alice, this.bob, this.currentTestcarol] = await ethers.getSigners()
        this.FaucetToken = await ethers.getContractFactory('FaucetToken')
    })
    beforeEach(async function (this) {
        this.snapshotId = await ethers.provider.send('evm_snapshot', [])
        const FaucetToken = await ethers.getContractFactory('FaucetToken')
        this.faucetToken = await FaucetToken.deploy()
        await this.faucetToken.deployed()
        // console.log('FaucetToken deployed to:', this.faucetToken.address)
        const tx = await this.faucetToken.initialize('ONEHorizonFaucetToken', 'OHFT')
        await ethers.provider.waitForTransaction(tx.hash)
    // const receipt = await ethers.provider.waitForTransaction(tx.hash)
    // console.log(`receipt: ${JSON.stringify(receipt)}`)
    })

    afterEach(async function (this) {
    // console.log(`Reverting Snapshot : ${snapshotId}`);
        await network.provider.send('evm_revert', [this.snapshotId])
    })

    describe('FaucetToken Tests', function (this) {
        it('FaucetToken-1 view functions should work', async function () {
            expect(await this.faucetToken.name()).to.equal('ONEHorizonFaucetToken')
            expect(await this.faucetToken.symbol()).to.equal('OHFT')
            expect(await this.faucetToken.decimals()).to.equal(18)
            expect(await this.faucetToken.totalSupply()).to.equal(0)
        })
        // Test all update functions by calling them and checking variables and events after calls
        // For event testing logic see this example repo https://github.com/fvictorio/hardhat-examples/tree/master/reading-events
        it('FaucetToken-2 update functions should work', async function () {
            // "function addBlockHeader(bytes,bytes32[4][64],bytes32[][64]) returns (bool)",
        })
        it('FaucetToken-3 reverts should work for negative use cases', async function () {
        })
        it('FaucetToken-4 complex tests should work', async function () {
        })
    })
})

/* List of functiona and events to test from data/abi/FaucetToken.json"
 "event Approval(address indexed,address indexed,uint256)",
  "event Initialized(uint8)",
  "event Transfer(address indexed,address indexed,uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function decreaseAllowance(address,uint256) returns (bool)",
  "function increaseAllowance(address,uint256) returns (bool)",
  "function initialize(string,string)",
  "function mint() returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function transferFrom(address,address,uint256) returns (bool)"
*/
