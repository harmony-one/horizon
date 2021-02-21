# Horizon Bridge Smart Contracts on Ethereum and Harmony
A set smart contracts that will provide functionalities to
* lock/unlock and mint/burn ERC20/HRC20 assets
* register a wrapped ERC20 on Ethereum via TokenManager contract for any native HRC20
* register a wrapped HRC20 on Harmony via TokenManager contract for any native ERC20 

## EventRouter.sol
Verify receipt proof from another chain and execute the it's event. If a event is subscribed, the subscriber's onEvent callback is fired.

## Bridge.sol
### Gateway contract
Gateway subscribes three events `TokenMapReq`,`TokenMapAck` and `Tansfer` from EventRouter. `TokenMapReq`/`TokenMapAck` events used to bind (ERC20,HRC20) token pair. `Tansfer` event used to cross chain transfer.

### GateManager contract
GateManager subscribes `newGate` event from EventRouter. `newGate` event used to bind the Gateway contrats from two differen chain. When the binding is complete, it means a bridge has been established between the two chains, then the two Gateways can used for token mapping and transfer. 
GateManager also responsible for creating and managing tokens.

## Simple Test
1. start a ligth client `truffle develop`
2. deploy contracts `truffle --network=develop deploy`
3. Gateway binding `truffle --network=develop exec scripts/GateMapping_test.js`
4. Token binding `truffle --network=develop exec scripts/TokenMapping_test.js`
5. Token transfer `truffle --network=develop exec scripts/TokenCrossTransfer_test.js`
