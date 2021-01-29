const { GetProof } = require('eth-proof');
const { encode } = require('eth-util-lite');

const D = console.log;

class Bridge {
    constructor(web3, routerContract) {
        this.web3 = web3;
        this.routerContract = routerContract;
        //this.bridgeContract = new web3.eth.Contract(bridgeJson.abi, bridgeAddress)
        this.gp = new GetProof(web3.eth.net.currentProvider.host);
    }

    async getProof(txHash) {
        const resp = await this.gp.receiptProof(txHash)
        const rawReceipt = await this.web3.eth.getTransactionReceipt(txHash)
        const blockHash = rawReceipt.blockHash.replace("0x", "")
        return {
            hash: Buffer.from(blockHash, 'hex'),
            root: resp.header.receiptRoot,
            proof: encode(resp.receiptProof),
            key: encode(Number(resp.txIndex)) // '0x12' => Nunmber
        }
    }

    execProof(proofData) {
        const {hash, root, key, proof} = proofData;
        return this.routerContract.ExecProof(hash, root, key, proof);
    }
}

module.exports = {Bridge}

