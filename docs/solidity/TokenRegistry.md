# TokenRegistry









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

### totalBridgedTokens

```solidity
function totalBridgedTokens() external view returns (uint256, uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |



## Events

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



