# TokenLockerOnHarmony









## Methods

### RxMapped

```solidity
function RxMapped(address) external view returns (contract BridgedToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BridgedToken | undefined |

### RxMappedInv

```solidity
function RxMappedInv(address) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### RxTokens

```solidity
function RxTokens(uint256) external view returns (contract BridgedToken)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract BridgedToken | undefined |

### TxMapped

```solidity
function TxMapped(address) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### TxMappedInv

```solidity
function TxMappedInv(address) external view returns (contract IERC20Upgradeable)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20Upgradeable | undefined |

### TxTokens

```solidity
function TxTokens(uint256) external view returns (contract IERC20Upgradeable)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IERC20Upgradeable | undefined |

### bind

```solidity
function bind(address otherSide) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| otherSide | address | undefined |

### changeLightClient

```solidity
function changeLightClient(contract EthereumLightClient newClient) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newClient | contract EthereumLightClient | undefined |

### initialize

```solidity
function initialize() external nonpayable
```






### issueTokenMapReq

```solidity
function issueTokenMapReq(contract ERC20Upgradeable thisSideToken) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| thisSideToken | contract ERC20Upgradeable | undefined |

### lightclient

```solidity
function lightclient() external view returns (contract EthereumLightClient)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract EthereumLightClient | undefined |

### lock

```solidity
function lock(contract IERC20Upgradeable token, address recipient, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | contract IERC20Upgradeable | undefined |
| recipient | address | undefined |
| amount | uint256 | undefined |

### otherSideBridge

```solidity
function otherSideBridge() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### spentReceipt

```solidity
function spentReceipt(bytes32) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### totalBridgedTokens

```solidity
function totalBridgedTokens() external view returns (uint256, uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### unlock

```solidity
function unlock(contract BridgedToken token, address recipient, uint256 amount) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token | contract BridgedToken | undefined |
| recipient | address | undefined |
| amount | uint256 | undefined |

### validateAndExecuteProof

```solidity
function validateAndExecuteProof(uint256 blockNo, bytes32 rootHash, bytes mptkey, bytes proof) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockNo | uint256 | undefined |
| rootHash | bytes32 | undefined |
| mptkey | bytes | undefined |
| proof | bytes | undefined |



## Events

### Burn

```solidity
event Burn(address indexed token, address indexed sender, uint256 amount, address recipient)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| sender `indexed` | address | undefined |
| amount  | uint256 | undefined |
| recipient  | address | undefined |

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### Locked

```solidity
event Locked(address indexed token, address indexed sender, uint256 amount, address recipient)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| token `indexed` | address | undefined |
| sender `indexed` | address | undefined |
| amount  | uint256 | undefined |
| recipient  | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### TokenMapAck

```solidity
event TokenMapAck(address indexed tokenReq, address indexed tokenAck)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenReq `indexed` | address | undefined |
| tokenAck `indexed` | address | undefined |

### TokenMapReq

```solidity
event TokenMapReq(address indexed tokenReq, uint8 indexed decimals, string name, string symbol)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| tokenReq `indexed` | address | undefined |
| decimals `indexed` | uint8 | undefined |
| name  | string | undefined |
| symbol  | string | undefined |



