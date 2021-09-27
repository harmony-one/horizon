const HarmonyParser = artifacts.require('HarmonyParser');
const rlp = require('rlp');
const parserData = require('./parser.data.json');

const {
    buffer2hex,
    expandkey,
    getHeader,
    getReceiptLight,
    getReceiptRlp,
    getReceiptTrie,
    index2key,
    getReceiptProof,
    getAccountProof,
    getTransactionProof,
} = require('../scripts/utils');

contract('HarmonyParser', async accounts => {
    let parser;

    it('deploy', async () => {
        parser = await HarmonyParser.new();
    });
    it('parse rlp block header', async () => {
        console.log(parser);
        let header = await parser.toBlockHeader(parserData.rlpheader);
        assert.equal(header.hash, parserData.hash);
    });

});    