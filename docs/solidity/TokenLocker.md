# TokenLocker









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

### issueTokenMapReq

```solidity
function issueTokenMapReq(contract ERC20Upgradeable thisSideToken) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| thisSideToken | contract ERC20Upgradeable | undefined |

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

### totalBridgedTokens

```solidity
function totalBridgedTokens() external view returns (uint256, uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

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



