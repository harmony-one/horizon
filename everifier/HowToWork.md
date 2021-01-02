# Basic Logic
1. eth-contract generate a event on-chain
2. js generate the event proof data off-chain
3. call hmy-contract's `function ExecProof(proof-data)`
4. hmy-contract verify the proof data then trigger function `onXxEvent(...)`
5. vice-versa

> for example: eth-contract emit `event Locked(A, B, C)`, and will trigger hmy-contract's `function onLockedEvent(A, B, C)`
> 
> hmy-contract's event also trigger eth-contract's `onXxEvent`

# Init a Bridge
## eth to hmy
1. call eth-contract `CreateRainbow()`，then will emit `event TokenMapReq(...)`
2. trigger hmy-contract `function onTokenMapReqEvent(...)`:
   1. create a new mintable token contract
   2. in the end, emit `event TokenMapAck(...)`
3. trigger eth-contract `function onTokenMapAckEvent(...)`, bridge init complete.
## hmy to eth
vice-versa

# Token CrossChain Transfer
## eth to hmy
### Token IN
1. user call ERC20's `Approve` to approve eth-contract spent their token
2. user call eth-contract's `RainbowTo`, it will emit `event Locked(...)`
3. trigger hmy-contract's `function onLockedEvent()`, Toekn-In complete
### Token BACK
1. user call HRC20's `Apprve` to approve hmy-contract spent their token
2. user call hmy-contract's `function RainbowBack()`, it will emit `event Burn(...)`
3. trigger eth-contract's `onBurnEvent()`, Toekn-Back complete.

## hmy to eth
vice-versa