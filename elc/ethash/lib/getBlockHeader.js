const { BlockHeader } = require('@ethereumjs/block');
const Web3Eth = require('web3-eth');
const { BN } = require('ethereumjs-util');

const EthUrl='https://mainnet.infura.io/v3/ef2ba412bbaf499191f98908f9229490';
const eth = new Web3Eth(EthUrl);

// web3.eth.getBlock

const toHex = num => '0x'+(new BN(num)).toString('hex');

function fromRPC(blockParams){
    const {
        parentHash,
        sha3Uncles,
        miner,
        stateRoot,
        transactionsRoot,
        receiptRoot,
        receiptsRoot,
        logsBloom,
        difficulty,
        number,
        gasLimit,
        gasUsed,
        timestamp,
        extraData,
        mixHash,
        nonce,
    } = blockParams

    
    return BlockHeader.fromHeaderData({
        parentHash,
        uncleHash: sha3Uncles,
        coinbase: miner,
        stateRoot,
        transactionsTrie: transactionsRoot,
        receiptTrie: receiptRoot || receiptsRoot,
        bloom: logsBloom,
        difficulty:toHex(difficulty),
        number:toHex(number),
        gasLimit: toHex(gasLimit),
        gasUsed: toHex(gasUsed),
        timestamp: toHex(timestamp),
        extraData,
        mixHash,
        nonce,
    });
}

function getBlockByNumber(blockNo) {
    return eth.getBlock(blockNo).then(fromRPC);
}

module.exports = {getBlockByNumber};