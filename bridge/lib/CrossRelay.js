function CrossRelay(from, to, txid) {
    return from.getProof(txid).then(proof=>to.execProof(proof))
}

module.exports = {CrossRelay}