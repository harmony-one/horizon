const yargs = require('yargs');
const ClientSol = artifacts.require("Client");

const D = console.log;

const argv = yargs
.option('list', {
    alias: 'l',
    description: 'List all functins',
})
.option('func', {
    alias: 'f',
    description: 'function to call',
    type: 'string',
})
.option('argv', {
    alias: 'a',
    description: 'arguments of function',
    type: 'string',
    array: true
})
.option('elc', {
    alias: 'c',
    description: 'Ethereum light client contract address',
    type: 'string',
})
.option('ethurl', {
    description: 'Ethereum RPC URL',
    type: 'string',
}).env()
.help()
.alias('help', 'h').argv;

const ElcAddress = argv.elc;

function listFuncs() {
    const abi = ClientSol.abi.filter(item=>item.type=='function');
    const states = ['pure', 'view', 'nonpayable', 'payable'];
    const funcStr = item => {
        const funcName = item.name;
        const state = item.stateMutability;
        const paramStr = item.inputs.reduce((a,param,index)=>{
            let paramStr = index > 0 ? ', ' : '';
            paramStr += param.type;
            if(param.name) paramStr += ' '+param.name;
            return a+paramStr;
        }, '');
        return `${funcName}(${paramStr}) ${state}`
    };
    console.log("Functions:")
    abi.filter(item=>states.includes(item.stateMutability)).forEach((item, index)=>{
        D(" ", index, funcStr(item));
    })
}

function callFuncs(client, func, argvs) {
    return client[func](...argvs);
}

async function main(){
    if(argv.list){
      return listFuncs()
    }
    const clientSol = ElcAddress ? await ClientSol.at(ElcAddress) : await ClientSol.deployed();

    const result = await callFuncs(clientSol, argv.func, argv.argv || []);
    console.log("result:")
    if(result && result.words) {
        console.log('0x'+result.toString('hex'));
    }else{
        if(argv.func == 'blocks'){
            return Object.keys(result).forEach(key=>{
                if(key.length==1) return;
                const value = result[key];
                console.log(` ${key} : 0x${value.toString('hex')}`);
            })
        }
        console.log(result);
    }
}

module.exports = function (result) {
    return main()
        .then(result).catch(result);
}
