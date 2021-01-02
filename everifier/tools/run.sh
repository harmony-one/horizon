#!/bin/sh

# $1 fromNET $2 toNET $3 txHash
eventRelay(){
    echo "relay $1 => $2 $3" 1>&2
    mapReqProof=`node $1.js $3`
    truffle --network=$2 exec ExecProof.js $mapReqProof | grep 0x
}

ethAccount=$1
hmyAccount=$2

ethnet="eth"
hmynet="hmy"

ERC20=`truffle --network=$ethnet exec newErc20.js | grep 0x`
echo eth: create ERC20 $ERC20

echo eth: CreateRainbow eth===hmy
mapReqTx=`truffle --network=$ethnet exec CreateRainbow.js $ERC20 | grep 0x`
mapAckTx=`eventRelay $ethnet $hmynet $mapReqTx`
eventRelay $hmynet $ethnet $mapAckTx

echo eth: rainbowTo
rainbowToTx=`truffle --network=$ethnet exec RainbowTo.js $ERC20 $ethAccount $hmyAccount 100`
eventRelay $ethnet $hmynet $rainbowToTx

echo eth: rainbowBack
rainbowBackTx=`truffle --network=$hmynet exec RainbowBack.js $ERC20 $ethAccount $hmyAccount 50`
eventRelay $hmynet $ethnet $rainbowBackTx