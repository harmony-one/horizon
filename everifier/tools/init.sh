#!/bin/sh
ethnet="eth"
hmynet="hmy"
truffle deploy --reset --network=$ethnet
truffle deploy --reset --network=$hmynet
ethAddress=`truffle exec address.js --network=$ethnet | grep 0x`
hmyAddress=`truffle exec address.js --network=$hmynet | grep 0x`
echo $ethAddress == $hmyAddress
truffle --network=$ethnet exec init.js $hmyAddress
truffle --network=$hmynet exec init.js $ethAddress