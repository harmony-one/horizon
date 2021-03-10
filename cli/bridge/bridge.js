class Bridge {
    // contract: bridge contract
    // prover: eprove/hprover
    constructor(web3, contract, prover) {
        this.web3 = web3;
        this.contract = contract;
        this.prover = prover;
    }

    getProof(txHash) {
        return this.prover.receiptProof(txHash)
    }

    execProof(proofData) {
        const {hash, root, key, proof} = proofData;
        const tx = this.contract.methods.ExecProof(hash, root, key, proof);
        return this.web3.sendTx(tx);
    }

    Bind(bridgeAddress) {
        const tx = this.contract.methods.Bind(bridgeAddress);
        return this.web3.sendTx(tx);
    }

    ChangeLightClient(clientAddress) {
        const tx = this.contract.methods.changeLightClient(clientAddress);
        return this.web3.sendTx(tx);
    } 

    RainbowMap(token) {
        const tx = this.contract.methods.RainbowMap(token);
        return this.web3.sendTx(tx);
    }

    RainbowTo(token, to, amount) {
        const tx = this.contract.methods.RainbowTo(token, to, amount);
        return this.web3.sendTx(tx);
    }

    RainbowBack(token, to, amount) {
        const tx = this.contract.methods.RainbowBack(token, to, amount);
        return this.web3.sendTx(tx);
    }

    async TokenPair(token, isTx=true) {
        const method = isTx?'TxMapped':'RxMappedInv';
        const result = await this.contract.methods[method](token).call();
        const pair = [token, result];
        return isTx?pair:pair.reverse();
    }

    // src: src Bridge
    // dest: dest Bridge
    // tx: tx hash on src chain
    static CrossRelay(src, dest, tx) {
        return src.getProof(tx).then(proof=>dest.execProof(proof));
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    static async TokenMap(src, dest, token) {
        const mapReq = await src.RainbowMap(token);
        // wait light client
        const mapAck = await Bridge.CrossRelay(src, dest, mapReq.transactionHash);
        // wait light client
        return Bridge.CrossRelay(dest, src, mapAck.transactionHash);
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenTo(src, dest, token, to, amount) {
        const tx = await src.RainbowTo(token, to, amount);
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash);
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenBack(src, dest, token, to, amount) {
        const tx = await src.RainbowBack(token, to, amount);
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash);
    }
}

module.exports = {Bridge}

