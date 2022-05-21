# MMRWrapper









## Methods

### addTree

```solidity
function addTree(bytes32[] itemHashes, uint256 width) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| itemHashes | bytes32[] | undefined |
| width | uint256 | undefined |

### append

```solidity
function append(bytes data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes | undefined |

### appendHash

```solidity
function appendHash(bytes32 data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| data | bytes32 | undefined |

### deserialize

```solidity
function deserialize(bytes rlpdata) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rlpdata | bytes | undefined |

### getHash

```solidity
function getHash(uint256 index) external view returns (bytes32 result)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| result | bytes32 | undefined |

### getMerkleProof

```solidity
function getMerkleProof(uint256 index) external view returns (bytes32 root, uint256 width, bytes32[] peakBagging, bytes32[] siblings)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| root | bytes32 | undefined |
| width | uint256 | undefined |
| peakBagging | bytes32[] | undefined |
| siblings | bytes32[] | undefined |

### getRoot

```solidity
function getRoot() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### getSize

```solidity
function getSize() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |




