# EthereumLightClient



> Ethereum light client





## Methods

### VerifyReceiptsHash

```solidity
function VerifyReceiptsHash(bytes32 blockHash, bytes32 receiptsHash) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockHash | bytes32 | undefined |
| receiptsHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### addBlockHeader

```solidity
function addBlockHeader(bytes _rlpHeader, bytes32[4][64] cache, bytes32[][64] proofs) external nonpayable returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _rlpHeader | bytes | undefined |
| cache | bytes32[4][64] | undefined |
| proofs | bytes32[][64] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### blockExisting

```solidity
function blockExisting(uint256) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### blockHeightMax

```solidity
function blockHeightMax() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### blocks

```solidity
function blocks(uint256) external view returns (uint256 parentHash, uint256 stateRoot, uint256 transactionsRoot, uint256 receiptsRoot, uint256 number, uint256 difficulty, uint256 time, uint256 hash)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| parentHash | uint256 | undefined |
| stateRoot | uint256 | undefined |
| transactionsRoot | uint256 | undefined |
| receiptsRoot | uint256 | undefined |
| number | uint256 | undefined |
| difficulty | uint256 | undefined |
| time | uint256 | undefined |
| hash | uint256 | undefined |

### blocksByHeight

```solidity
function blocksByHeight(uint256, uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |
| _1 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### blocksByHeightExisting

```solidity
function blocksByHeightExisting(uint256) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### finalityConfirms

```solidity
function finalityConfirms() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### finalizedBlocks

```solidity
function finalizedBlocks(uint256) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### firstBlock

```solidity
function firstBlock() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getBlockHeightMax

```solidity
function getBlockHeightMax() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getReceiptRoot

```solidity
function getReceiptRoot(bytes32 blockHash) external view returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getStateRoot

```solidity
function getStateRoot(bytes32 blockHash) external view returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getTxRoot

```solidity
function getTxRoot(bytes32 blockHash) external view returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### initialize

```solidity
function initialize(bytes _rlpHeader) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _rlpHeader | bytes | undefined |

### longestBranchHead

```solidity
function longestBranchHead(uint256) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### verifiedBlocks

```solidity
function verifiedBlocks(uint256) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### verifyEthash

```solidity
function verifyEthash(bytes32 hash, uint64 nonce, uint64 number, bytes32[4][64] cache, bytes32[][64] proofs, uint256 difficulty, uint256 mixHash) external pure returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| hash | bytes32 | undefined |
| nonce | uint64 | undefined |
| number | uint64 | undefined |
| cache | bytes32[4][64] | undefined |
| proofs | bytes32[][64] | undefined |
| difficulty | uint256 | undefined |
| mixHash | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### Initialized

```solidity
event Initialized(uint8 version)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| version  | uint8 | undefined |

### Paused

```solidity
event Paused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



