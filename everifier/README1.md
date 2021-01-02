# harmony_rainbow
Personal rainbow bridge for hmy&lt;>eth

## 1. install

```
npm install
```

## 2. Config

Create the following env files with customed config

### envs/eth.env

```
ETH_NODE_URL='https://ropsten.infura.io/v3/ef2ba412bbaf499191f98908f9229490'
ETH_ADMIN_PRIVATE_KEY={private-key-for-account-used-for-deploy}
ETH_USER_PRIVATE_KEY={private-key-as-user}
ETH_GAS_LIMIT=4712388
ETH_GAS_PRICE_MULTIPLER=2
```

### envs/hmy.env

```
HMY_NODE_URL='https://api.s0.b.hmny.io'
PRIVATE_KEY={private-key-for-account-used-for-deploy}
PRIVATE_KEY_USER={private-key-as-user}
GAS_LIMIT=6721900
GAS_PRICE=1000000000
```

## 3. Compile

```
truffle compile
```

## 4. deploy

```
node scripts/deploy.js
```

Deployed contracts addresses will be saved to `build/deployed.json`

## 5. test (bridge with centralized entity)

```
node scripts/end2end.js
```
