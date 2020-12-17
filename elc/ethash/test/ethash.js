const EthashSol = artifacts.require("Ethash");
const LittleEndian = artifacts.require("LittleEndian");
const Keccak512 = artifacts.require("Keccak512");
const Ethash = require('@ethereumjs/ethash');
const randomBytes = require('randombytes');

const D = console.log;
const toHex = web3.utils.asciiToHex;

const testcase = {
    cacheSize: 1024,
    hash: Buffer.from('c9149cc0386e689d789a1c2f3d5d169a61a6218ed30e74414dc736e442ef3d1f', 'hex'),
    nonce: Buffer(8),
    seed: Buffer(32),
    want: {
        digest: Buffer.from('e4073cffaef931d37117cefd9afd27ea0f1cad6a981dd2605c4a1ac97c519800', 'hex'),
        result: Buffer.from('d3539235ee2e6f8db665c0a72169f55b7f6c605712330b778ec3944f0eb5a557', 'hex')
    }
}

const cache = [
    '0x1c99e27c', '0xf47b1f95', '0x11bbc1c4', '0x7ee8798', '0x33b51e87', '0xb8977b9d', '0xc7858e58', '0xe590de42', '0xbe5bfdba', '0x133ae96c', '0x9abeb64f', '0xb90de3d3', '0xa228959d', '0x834678ea', '0xcae9523f', '0x546b9b11', '0xc487989', '0x7299e146', '0x773807bd', '0x1b2c939c', '0xa265e643', '0xfc2231fd', '0x9126db3d', '0xb0ce53f3', '0xb8383eed', '0x5bd51ff5', '0x7294069', '0x9f3c5643', '0x2e82a88f', '0x65241961', '0x2aa10175', '0x8d8aabaf', '0xba5ffb88', '0x149da9e3', '0x67062479', '0x63a782e', '0x79420a94', '0xbc381c9b', '0xb65d7128', '0x1fb17cd3', '0xe3246b9f', '0xdd52dc86', '0xd86b288c', '0x13a86fc3', '0x4844fedf', '0xbc6ef5a9', '0x6b86eabe', '0x228df642', '0xe4aa326c', '0x3ca295d6', '0x74fd28ab', '0xc2b053af', '0xc18ccef', '0xbccacea', '0x301282e', '0x3ca097d0', '0xf0f1b1d', '0x325fce26', '0xf93802a9', '0x45f649bc', '0xf91e00db', '0xd4133dcd', '0x41f84347', '0x371ad1fa', '0x620c29fa', '0xf74260c1', '0x21895703', '0x51990bf3', '0x2aae5a46', '0xd4daa5f4', '0xd741733a', '0x5027a6b4', '0xa4654995', '0xf63a1c7a',
    '0x9534dc38', '0x9b2ad6c4', '0x683184ab', '0x1401fcc9', '0xd1ff9ce7', '0x17b82b2', '0xa00bd375', '0x218f6554', '0xf26c944e', '0xdb4434c', '0xb0fb8333', '0xe5083449', '0x342439c5', '0xcfbb21ca', '0xfb0d2043', '0x3d716c87', '0x93131820', '0xf485a44f', '0x91c56787', '0x9cf4557', '0xfdcb186', '0x4877e533', '0xe23e48bf', '0x8d24f4af', '0xc01e46fe', '0x62134a50', '0xf020184', '0x583826c2', '0x522f8f4a', '0x2f3ba106', '0xc7983823', '0x1cb25983', '0x4d022682', '0xdf937a0a', '0x82c2b65e', '0x5a00bfbd', '0x7e49ab4a', '0x47286f09', '0xee1cc776', '0x8f2a9357', '0x6b6d9fb8', '0xab64387', '0x8974a34e', '0xe0a2949a', '0xc5d518f2', '0xfbce1858', '0x52c89017', '0xa3db769a', '0x450fbb1e', '0xb409d792', '0x31d28795', '0x9cd37079', '0xdd186f08', '0xd9914224', '0x7016dbee', '0x35e3535e', '0x4fbd9105', '0x356a56f4', '0xc0fac95', '0x115e4be2', '0x3b033d2a', '0xea6f1bc5', '0x6d29920a', '0x205e7fea', '0xbce66ebf', '0x8f867d34', '0x393c19da', '0x47b19b5b', '0x9f5a5ee5', '0x41e7cf67', '0x697dea7e', '0xd15b159b', '0x4d200438',
    '0xfa91eaf7', '0x47e44992', '0x51f3dd4d', '0x1970f788', '0x1e207dc6', '0x7d7104c', '0x92d45a9c', '0xf9ff1aa7', '0xe9a73ca2', '0x1b7dba00', '0x7032afde', '0xb38e4d51', '0xa8aab5e', '0x27b78b71', '0x7637eb3a', '0xed89a58f', '0xbf1fb08a', '0xebf42740', '0x28e1badb', '0x5f481ed2', '0x18201c06', '0xe3c29b3a', '0x7dadb1e', '0x9d2e4427', '0xe10feb58', '0xe10f4498', '0x772ee099', '0x99b9f7c0', '0x4cf7f173', '0x519a08c9', '0x4ac996ab', '0x6a6ed684', '0xa2d8ba4', '0xb5ad4345', '0x9a0389a7', '0x35b3a72a', '0x10c985ca', '0xc8d3c726', '0xae53da94', '0xc3884136', '0x8ef792fd', '0x3980d001', '0x73a48498', '0x2e79aa85', '0xda0c1538', '0x2e0b62a8', '0xfb41cabe', '0x83bb73c7', '0x4d725e7b', '0x57deb26e', '0x8d85990d', '0x70d9d7f0', '0x381fb67', '0x875717b2', '0x9750733b', '0xea3b5db3', '0x59c3d18f', '0x3ca6e8a9', '0x6cc74015', '0x8dcf8497', '0x5c995e97', '0xb9018477', '0xe6662e4a', '0x7ad63a99', '0x2adcecd3', '0x9f7717cb', '0x6860a81e', '0xb192ec27', '0x8c8f721c', '0x43f6d3b', '0x5ede6a3', '0x76dd81ff', '0x9556dcd5', '0xbc7703a5',
    '0x16af5a13', '0xb768cf71', '0x93543150', '0x151646c', '0x1233d564', '0x74413cbf', '0x7b237a0c', '0xa1f4fa05', '0x958abd91', '0x8d06fada', '0x2570f3bc', '0x59725c', '0x4f935cce', '0xcfadfe36', '0x7c685be5', '0xc1740544', '0xd2396ff0', '0x3d55a807', '0x246a1539', '0xfd645f84', '0x85bb2483', '0xde792931', '0x64f774ad', '0xab7a67c9', '0xd41a8089', '0xc0f127f9', '0x8fe2120f', '0xb42b4222', '0x96d10042', '0x77b39a9d', '0x9d096bdd', '0x22c3dbc6', '0xb221932e', '0x8e4fe8c1', '0x1c73072f'
]


async function EthashTest() {
    const ethash = new Ethash.default();
    const dataCache = ethash.mkcache(testcase.cacheSize, testcase.seed); // dataCache and cache is equivalent
    //const cache = dataCache.reduce();
    //const le = await LittleEndian.new();
    //Keccak512.link('LittleEndian', le.address);
    const k512 = await Keccak512.new();
    //EthashSol.link('LittleEndian', le.address);
    EthashSol.link('Keccak512', k512.address);
    const ethashSol = await EthashSol.new();
    D(ethashSol.address);
    //const result = await ethashSol.hashimotoLight.sendTransaction(1024*32, cache, testcase.hash, 0, {gas:80000000});
    const result = await ethashSol.hashimotoLight.call(1024*32, cache, testcase.hash, 0, {gas:80000000});
    return {
        mix: Buffer.from(result[0].slice(2), 'hex'),
        hash: Buffer.from(result[1].slice(2), 'hex')
    }
}


async function main() {
    const ethash = new Ethash.default();
    ethash.mkcache(testcase.cacheSize, testcase.seed);
    const result = ethash.run(testcase.hash, testcase.nonce, 1024*32);
    D(result.mix.equals(testcase.want.digest));
    D(result.hash.equals(testcase.want.result));
    D(result);
    const resultSol = await EthashTest();
    D(resultSol.mix.equals(testcase.want.digest));
    D(resultSol.hash.equals(testcase.want.result));
    D(resultSol);
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
