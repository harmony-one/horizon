# HarmonyLightClient









## Methods

### DEFAULT_ADMIN_ROLE

```solidity
function DEFAULT_ADMIN_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### RELAYER_ROLE

```solidity
function RELAYER_ROLE() external view returns (bytes32)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### adminAddRelayer

```solidity
function adminAddRelayer(address relayerAddress) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| relayerAddress | address | undefined |

### adminChangeRelayerThreshold

```solidity
function adminChangeRelayerThreshold(uint256 newThreshold) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newThreshold | uint256 | undefined |

### adminPauseLightClient

```solidity
function adminPauseLightClient() external nonpayable
```






### adminRemoveRelayer

```solidity
function adminRemoveRelayer(address relayerAddress) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| relayerAddress | address | undefined |

### adminUnpauseLightClient

```solidity
function adminUnpauseLightClient() external nonpayable
```






### getLatestCheckPoint

```solidity
function getLatestCheckPoint(uint256 blockNumber, uint256 epoch) external view returns (struct HarmonyLightClient.BlockHeader checkPointBlock)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| blockNumber | uint256 | undefined |
| epoch | uint256 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| checkPointBlock | HarmonyLightClient.BlockHeader | undefined |

### getRoleAdmin

```solidity
function getRoleAdmin(bytes32 role) external view returns (bytes32)
```



*Returns the admin role that controls `role`. See {grantRole} and {revokeRole}. To change a role&#39;s admin, use {_setRoleAdmin}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes32 | undefined |

### grantRole

```solidity
function grantRole(bytes32 role, address account) external nonpayable
```



*Grants `role` to `account`. If `account` had not been already granted `role`, emits a {RoleGranted} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### hasRole

```solidity
function hasRole(bytes32 role, address account) external view returns (bool)
```



*Returns `true` if `account` has been granted `role`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### initialize

```solidity
function initialize(bytes firstRlpHeader, address[] initialRelayers, uint8 initialRelayerThreshold) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| firstRlpHeader | bytes | undefined |
| initialRelayers | address[] | undefined |
| initialRelayerThreshold | uint8 | undefined |

### isValidCheckPoint

```solidity
function isValidCheckPoint(uint256 epoch, bytes32 mmrRoot) external view returns (bool status)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| epoch | uint256 | undefined |
| mmrRoot | bytes32 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| status | bool | undefined |

### paused

```solidity
function paused() external view returns (bool)
```



*Returns true if the contract is paused, and false otherwise.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### renounceAdmin

```solidity
function renounceAdmin(address newAdmin) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newAdmin | address | undefined |

### renounceRole

```solidity
function renounceRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from the calling account. Roles are often managed via {grantRole} and {revokeRole}: this function&#39;s purpose is to provide a mechanism for accounts to lose their privileges if they are compromised (such as when a trusted device is misplaced). If the calling account had been revoked `role`, emits a {RoleRevoked} event. Requirements: - the caller must be `account`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### revokeRole

```solidity
function revokeRole(bytes32 role, address account) external nonpayable
```



*Revokes `role` from `account`. If `account` had been granted `role`, emits a {RoleRevoked} event. Requirements: - the caller must have ``role``&#39;s admin role.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| role | bytes32 | undefined |
| account | address | undefined |

### submitCheckpoint

```solidity
function submitCheckpoint(bytes rlpHeader) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| rlpHeader | bytes | undefined |

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) external view returns (bool)
```



*See {IERC165-supportsInterface}.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceId | bytes4 | undefined |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |



## Events

### CheckPoint

```solidity
event CheckPoint(bytes32 stateRoot, bytes32 transactionsRoot, bytes32 receiptsRoot, uint256 number, uint256 epoch, uint256 shard, uint256 time, bytes32 mmrRoot, bytes32 hash)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| stateRoot  | bytes32 | undefined |
| transactionsRoot  | bytes32 | undefined |
| receiptsRoot  | bytes32 | undefined |
| number  | uint256 | undefined |
| epoch  | uint256 | undefined |
| shard  | uint256 | undefined |
| time  | uint256 | undefined |
| mmrRoot  | bytes32 | undefined |
| hash  | bytes32 | undefined |

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

### RelayerAdded

```solidity
event RelayerAdded(address relayer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| relayer  | address | undefined |

### RelayerRemoved

```solidity
event RelayerRemoved(address relayer)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| relayer  | address | undefined |

### RelayerThresholdChanged

```solidity
event RelayerThresholdChanged(uint256 newThreshold)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| newThreshold  | uint256 | undefined |

### RoleAdminChanged

```solidity
event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| previousAdminRole `indexed` | bytes32 | undefined |
| newAdminRole `indexed` | bytes32 | undefined |

### RoleGranted

```solidity
event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### RoleRevoked

```solidity
event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| role `indexed` | bytes32 | undefined |
| account `indexed` | address | undefined |
| sender `indexed` | address | undefined |

### Unpaused

```solidity
event Unpaused(address account)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account  | address | undefined |



