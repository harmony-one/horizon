const { encode: rlpEncode, keccak: keccak256 } = require('eth-util-lite');
const { BaseTrie: Tree } = require('merkle-patricia-tree')
const { bufferToNibbles,matchingNibbleLength } = require('merkle-patricia-tree/dist/util/nibbles')
const { BranchNode, ExtensionNode, LeafNode } = require('merkle-patricia-tree/dist/trieNode')
const Rpc = require('isomorphic-rpc')
const { Header, Proof, Receipt } = require('eth-object')
const { BigNumber } = require('ethers')

class EProver {
    constructor(ethUrl, cache) {
        this.rpc = new Rpc(ethUrl);
        this.cache = cache || {}
        this.txTrees = {}
    }

    async getReceipt(txHash) {
        return this.cache[txHash] || (this.cache[txHash] = await this.rpc.eth_getTransactionReceipt(txHash))
    }
    async getBlock(blockHash) {
        return this.cache[blockHash] || (this.cache[blockHash] = await this.rpc.eth_getBlockByHash(blockHash, false))
    }

    async getReceiptTree(blockHash) {
        if (this.txTrees[blockHash]) return this.txTrees[blockHash]
        const rpcBlock = await this.getBlock(blockHash)
        const receipts = await (await Promise.all(rpcBlock.transactions.map(siblingTxHash => this.getReceipt(siblingTxHash))))
        const tree = new Tree();
        await Promise.all(receipts.map((siblingReceipt, index) => {
            const siblingPath = rlpEncode(index)
            const serializedReceipt = Receipt.fromRpc(siblingReceipt).serialize()
            return tree.put(siblingPath, serializedReceipt)
        }))
        if(Buffer.compare(Header.fromRpc(rpcBlock).receiptRoot, tree.root) != 0) throw "receiptRoot error"
        this.txTrees[blockHash] = tree
        return tree
    }

    async receiptProof(txHash) {
        const targetReceipt = await this.getReceipt(txHash)
        if (!targetReceipt) throw new Error("txhash/targetReceipt not found. (use Archive node)")
        const rpcBlock = await this.getBlock(targetReceipt.blockHash)
        const tree = await this.getReceiptTree(targetReceipt.blockHash)
        const key = rlpEncode(targetReceipt.transactionIndex)
        let nibbles = bufferToNibbles(key)
        const proofIndex = []
        const { node, stack } = await tree.findPath(key)
        for (let i in stack) {
            const node = stack[i]
            if (node instanceof ExtensionNode) {
                if(matchingNibbleLength(nibbles, node.key) != node.key.length) throw "invalid ExtensionNode node"
                nibbles = nibbles.slice(node.key.length)
                proofIndex.push(1)
            } else if (node instanceof LeafNode) {
                proofIndex.push(1)
            } else if (node instanceof BranchNode) {
                proofIndex.push(nibbles[0] != undefined ? nibbles[0] : 16)
                nibbles = nibbles.slice(1)
            } else {
                throw "invalid node"
            }
        }
        return {
            header: Header.fromRpc(rpcBlock),
            proof: Proof.fromRaw(stack.map(trieNode => trieNode.raw())),
            txIndex: Number(targetReceipt.transactionIndex),
            key,
            tree,
            node,
            proofIndex: Buffer.from(proofIndex),
        }
    }

    async receiptProofABIV2(txHash) {
        const resp = await this.receiptProof(txHash);
        return {
            hash: keccak256(resp.header.serialize()),
            root: resp.tree.root,
            proof: rlpEncode(resp.proof),
            key: BigNumber.from(Buffer.from(resp.proofIndex).reverse()),
        }
    }
}

module.exports = { EProver }
