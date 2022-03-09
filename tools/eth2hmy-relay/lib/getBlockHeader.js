const { BlockHeader } = require('@ethereumjs/block');
const Web3Eth = require('web3-eth');
const { BN } = require('ethereumjs-util');
const { default: Common, Chain, Hardfork } = require('@ethereumjs/common');

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
        baseFeePerGas,
        timestamp,
        extraData,
        mixHash,
        nonce,
    } = blockParams

    let opts = undefined;
    let headerData = {
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
    };

    if (baseFeePerGas != undefined) {
        opts =  { common: new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London }) };
        headerData.baseFeePerGas = toHex(baseFeePerGas);
    }

    return BlockHeader.fromHeaderData(headerData, opts);
}

function getBlockByNumber(url, blockNo) {
    const eth = new Web3Eth(url);
    return eth.getBlock(blockNo).then(fromRPC);
}

module.exports = {getBlockByNumber};