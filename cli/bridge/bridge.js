class Bridge {
    // contract: bridge contract
    // prover: eprover/hprover
    constructor(web3, contract, prover) {
        this.web3 = web3;
        this.contract = contract;
        this.prover = prover;
    }

    getProof(txHash) {
        return this.prover.receiptProofABIV2(txHash);
    }

    ExecProof(proofData) {
        const { blockHash, root, key, proof } = proofData;
        const tx = this.contract.methods.validateAndExecuteProof(
            blockHash,
            root,
            key,
            proof
        );
        return this.web3.sendTx(tx);
    }

    Initialize() {
        const tx = this.contract.methods.initialize();
        return this.web3.sendTx(tx);
    }

    Bind(bridgeAddress) {
        const tx = this.contract.methods.bind(bridgeAddress);
        return this.web3.sendTx(tx);
    }

    ChangeLightClient(clientAddress) {
        const tx = this.contract.methods.changeLightClient(clientAddress);
        return this.web3.sendTx(tx);
    }

    IssueTokenMapReq(token) {
        const tx = this.contract.methods.issueTokenMapReq(token);
        return this.web3.sendTx(tx);
    }

    Lock(token, to, amount) {
        const tx = this.contract.methods.lock(token, to, amount);
        return this.web3.sendTx(tx);
    }

    Unlock(token, to, amount) {
        const tx = this.contract.methods.unlock(token, to, amount);
        return this.web3.sendTx(tx);
    }

    async TokenPair(token, isTx = true) {
        const method = isTx ? "TxMapped" : "RxMappedInv";
        const result = await this.contract.methods[method](token).call();
        const pair = [token, result];
        return isTx ? pair : pair.reverse();
    }

    // src: src Bridge
    // dest: dest Bridge
    // tx: tx hash on src chain
    static CrossRelay(src, dest, tx) {
        return src.getProof(tx).then((proof) => dest.ExecProof(proof));
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    static async TokenMap(src, dest, token) {
        console.log("map request: ")
        console.log(src)
        const mapReq = await src.IssueTokenMapReq(token);
        // wait light client
        console.log("Printing Map Req: ");
        console.log(mapReq);
        console.log("Sending Map Ack");
        const mapAck = await Bridge.CrossRelay(src, dest, mapReq.transactionHash);
        // wait light client
        console.log("Printing Map Ack: ");
        console.log(mapAck);
        console.log("Map finish")
        return Bridge.CrossRelay(dest, src, mapAck.transactionHash);
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenTo(src, dest, token, to, amount) {
        const tx = await src.Lock(token, to, amount);
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash);
    }

    // src: src Bridge
    // dest: dest Bridge
    // token: ERC20 address on src chain
    // to: receipt address on dest chain
    // amount: token amount
    static async TokenBack(src, dest, token, to, amount) {
        const tx = await src.Unlock(token, to, amount);
        // wait light client
        return Bridge.CrossRelay(src, dest, tx.transactionHash);
    }
}

module.exports = { Bridge };
