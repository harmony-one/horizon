# MMR

*Wanseob Lim &lt;email@wanseob.com&gt;*

> Merkle Mountain Range solidity library



*The index of this MMR implementation starts from 1 not 0.      And it uses keccak256 for its hash function instead of blake2b*

## Methods

### getChildren

```solidity
function getChildren(uint256 index) external pure returns (uint256 left, uint256 right)
```



*It returns the children when it is a parent node*

#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| left | uint256 | undefined |
| right | uint256 | undefined |

### getLeafIndex

```solidity
function getLeafIndex(uint256 width) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### getPeakIndexes

```solidity
function getPeakIndexes(uint256 width) external pure returns (uint256[] peakIndexes)
```



*It returns all peaks of the smallest merkle mountain range tree which includes      the given index(size)*

#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| peakIndexes | uint256[] | undefined |

### getSize

```solidity
function getSize(uint256 width) external pure returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### hashBranch

```solidity
function hashBranch(bytes32 left, bytes32 right) external pure returns (bytes32)
```



*It returns the hash a parent node with hash(M | Left child | Right child)      M is the index of the node*

#### Parameters

| Name | Type | Description |
|---|---|---|
| left | bytes32 | undefined |
| right | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### hashLeaf

```solidity
function hashLeaf(uint256 index, bytes32 dataHash) external pure returns (bytes32)
```



*it returns the hash of a leaf node with hash(M | DATA )      M is the index of the node*

#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |
| dataHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### heightAt

```solidity
function heightAt(uint256 index) external pure returns (uint8 height)
```



*It returns the height of the index*

#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| height | uint8 | undefined |

### inclusionProof

```solidity
function inclusionProof(bytes32 root, uint256 width, uint256 index, bytes value, bytes32[] peaks, bytes32[] siblings) external pure returns (bool)
```



*It returns true when the given params verifies that the given value exists in the tree or reverts the transaction.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| root | bytes32 | undefined |
| width | uint256 | undefined |
| index | uint256 | undefined |
| value | bytes | undefined |
| peaks | bytes32[] | undefined |
| siblings | bytes32[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### isLeaf

```solidity
function isLeaf(uint256 index) external pure returns (bool)
```



*It returns whether the index is the leaf node or not*

#### Parameters

| Name | Type | Description |
|---|---|---|
| index | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### mountainHeight

```solidity
function mountainHeight(uint256 size) external pure returns (uint8)
```



*It returns the height of the highest peak*

#### Parameters

| Name | Type | Description |
|---|---|---|
| size | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint8 | undefined |

### numOfPeaks

```solidity
function numOfPeaks(uint256 width) external pure returns (uint256 num)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| num | uint256 | undefined |

### peakBagging

```solidity
function peakBagging(uint256 width, bytes32[] peaks) external pure returns (bytes32)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |
| peaks | bytes32[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### peakMapToPeaks

```solidity
function peakMapToPeaks(uint256 width, bytes32[255] peakMap) external pure returns (bytes32[] peaks)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |
| peakMap | bytes32[255] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| peaks | bytes32[] | undefined |

### peakUpdate

```solidity
function peakUpdate(uint256 width, bytes32[255] prevPeakMap, bytes32 itemHash) external pure returns (bytes32[255] nextPeakMap)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |
| prevPeakMap | bytes32[255] | undefined |
| itemHash | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| nextPeakMap | bytes32[255] | undefined |

### peaksToPeakMap

```solidity
function peaksToPeakMap(uint256 width, bytes32[] peaks) external pure returns (bytes32[255] peakMap)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| width | uint256 | undefined |
| peaks | bytes32[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| peakMap | bytes32[255] | undefined |

### rollUp

```solidity
function rollUp(bytes32 root, uint256 width, bytes32[] peaks, bytes32[] itemHashes) external pure returns (bytes32 newRoot)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| root | bytes32 | undefined |
| width | uint256 | undefined |
| peaks | bytes32[] | undefined |
| itemHashes | bytes32[] | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| newRoot | bytes32 | undefined |




