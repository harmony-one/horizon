#!/usr/bin/env node
const path = require('path')
const os = require('os')
const { program } = require('commander')

// const { CleanCommand } = require('./commands/clean')
// const { PrepareCommand } = require('./commands/prepare')
// const { StatusCommand } = require('./commands/status')
const {
  StartEth2HmyRelayCommand,
} = require('./cli/start/eth2hmy-relay.js')
// const {
//   StartHarmony2EthRelayCommand,
// } = require('./commands/start/harmony2eth-relay.js')
// const { StartWatchdogCommand } = require('./commands/start/watchdog.js')
// const { StartGanacheNodeCommand } = require('./commands/start/ganache.js')
// const { StartLocalHarmonyNodeCommand } = require('./commands/start/harmony.js')
const { StopManagedProcessCommand } = require('./cli/stop/process.js')
// const {
//   DangerSubmitInvalidHarmonyBlock,
// } = require('./commands/danger-submit-invalid-harmony-block')
// const { DangerDeployMyERC20 } = require('./commands/danger-deploy-myerc20')
// const {
//   TransferETHERC20ToHarmony,
//   TransferEthERC20FromHarmony,
//   DeployToken,
// } = require('harmony-bridge-lib/transfer-eth-erc20')
// const { ETHDump } = require('./commands/eth-dump')
// const { HarmonyDump } = require('harmony-bridge-lib/harmony/harmony-dump')
const { BridgeConfig } = require('./harmony-bridge-lib/config/index.js')
// const {
//   InitHarmonyContracts,
//   InitHarmonyTokenFactory,
//   InitEthEd25519,
//   InitEthErc20,
//   InitEthLocker,
//   InitEthClient,
//   InitEthProver,
// } = require('harmony-bridge-lib/init')

// source dir or where harmony-bridge cli is installed (when install with npm)
const BRIDGE_SRC_DIR = __dirname
const LIBS_SOL_SRC_DIR = path.join(
  BRIDGE_SRC_DIR,
  'node_modules/harmony-bridge-sol'
)

//will be used for harmony contracts and will later has to be changed to right package name
const LIBS_RS_SRC_DIR = path.join(
  BRIDGE_SRC_DIR,
  'node_modules/harmony-bridge-rs'
)
const LIBS_TC_SRC_DIR = path.join(
  BRIDGE_SRC_DIR,
  'node_modules/harmony-token-connector'
)

BridgeConfig.declareOption(
  'harmony-network-id',
  'The identifier of the NEAR network that the given NEAR node is expected to represent.'
)
BridgeConfig.declareOption('harmony-node-url', 'The URL of the NEAR node.')
BridgeConfig.declareOption('eth-node-url', 'The URL of the Ethereum node.')
BridgeConfig.declareOption(
  'harmony-master-account',
  'The account of the master account on NEAR blockchain that can be used to deploy and initialize the test contracts.' +
    ' This account will also own the initial supply of the fungible tokens.'
)
BridgeConfig.declareOption(
  'harmony-master-sk',
  'The secret key of the master account on NEAR blockchain.'
)
BridgeConfig.declareOption(
  'eth-master-sk',
  'The secret key of the master account on Ethereum blockchain.'
)
BridgeConfig.declareOption(
  'harmony-client-account',
  'The account of the Harmony Client contract that can be used to accept ETH headers.',
  'rainbow_bridge_eth_on_harmony_client'
)
BridgeConfig.declareOption(
  'harmony-client-sk',
  'The secret key of the Harmony Client account. If not specified will use master SK.'
)
BridgeConfig.declareOption(
  'harmony-client-contract-path',
  'The path to the Wasm file containing the Harmony Client contract.',
  path.join(LIBS_RS_SRC_DIR, 'res/eth_client.wasm')
)
BridgeConfig.declareOption(
  'harmony-client-init-balance',
  'The initial balance of Harmony Client contract in femtoNEAR.',
  '100000000000000000000000000'
)
BridgeConfig.declareOption(
  'harmony-client-validate-ethash',
  'Whether validate ethash of submitted eth block, should set to true on mainnet and false on PoA testnets',
  'true'
)
BridgeConfig.declareOption(
  'harmony-client-trusted-signer',
  'When non empty, deploy as trusted-signer mode where only tursted signer can submit blocks to client',
  ''
)
BridgeConfig.declareOption(
  'harmony-prover-account',
  'The account of the Harmony Prover contract that can be used to accept ETH headers.',
  'rainbow_bridge_eth_on_harmony_prover'
)
BridgeConfig.declareOption(
  'harmony-prover-sk',
  'The secret key of the Harmony Prover account. If not specified will use master SK.'
)
BridgeConfig.declareOption(
  'harmony-prover-contract-path',
  'The path to the Wasm file containing the Harmony Prover contract.',
  path.join(LIBS_RS_SRC_DIR, 'res/eth_prover.wasm')
)
BridgeConfig.declareOption(
  'harmony-prover-init-balance',
  'The initial balance of Harmony Prover contract in femtoNEAR.',
  '100000000000000000000000000'
)
BridgeConfig.declareOption(
  'daemon',
  'Whether the process should be launched as a daemon.',
  'true',
  true
)
BridgeConfig.declareOption(
  'core-src',
  'Path to the harmonycore source. It will be downloaded if not provided.',
  ''
)
BridgeConfig.declareOption(
  'harmonyup-src',
  'Path to the harmonyup source. It will be downloaded if not provided.',
  ''
)
BridgeConfig.declareOption(
  'eth-gas-multiplier',
  'How many times more in Ethereum gas are we willing to overpay.',
  '1'
)

// User-specific arguments.
BridgeConfig.declareOption(
  'harmony-token-factory-account',
  'The account of the token factory contract that will be used to mint tokens locked on Ethereum.',
  'harmonytokenfactory'
)
BridgeConfig.declareOption(
  'harmony-token-factory-sk',
  'The secret key of the token factory account. If not specified will use master SK.'
)
BridgeConfig.declareOption(
  'harmony-token-factory-contract-path',
  'The path to the Wasm file containing the token factory contract.',
  path.join(LIBS_TC_SRC_DIR, 'res/bridge_token_factory.wasm')
)
BridgeConfig.declareOption(
  'harmony-token-factory-init-balance',
  'The initial balance of token factory contract in yoctoNEAR.',
  '1000000000000000000000000000'
)
BridgeConfig.declareOption(
  'eth-locker-address',
  'ETH address of the locker contract.'
)
BridgeConfig.declareOption(
  'eth-locker-abi-path',
  'Path to the .abi file defining Ethereum locker contract. This contract works in pair with mintable fungible token on NEAR blockchain.',
  path.join(LIBS_TC_SRC_DIR, 'res/BridgeTokenFactory.full.abi')
)
BridgeConfig.declareOption(
  'eth-locker-bin-path',
  'Path to the .bin file defining Ethereum locker contract. This contract works in pair with mintable fungible token on NEAR blockchain.',
  path.join(LIBS_TC_SRC_DIR, 'res/BridgeTokenFactory.full.bin')
)
BridgeConfig.declareOption(
  'eth-erc20-address',
  'ETH address of the ERC20 contract.'
)
BridgeConfig.declareOption(
  'eth-erc20-abi-path',
  'Path to the .abi file defining Ethereum ERC20 contract.',
  path.join(LIBS_TC_SRC_DIR, 'res/TToken.full.abi')
)
BridgeConfig.declareOption(
  'eth-erc20-bin-path',
  'Path to the .bin file defining Ethereum ERC20 contract.',
  path.join(LIBS_TC_SRC_DIR, 'res/TToken.full.bin')
)
BridgeConfig.declareOption(
  'eth-ed25519-address',
  'ETH address of the ED25519 contract.'
)
BridgeConfig.declareOption(
  'eth-ed25519-abi-path',
  'Path to the .abi file defining Ethereum ED25519 contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonybridge/dist/Ed25519.full.abi')
)
BridgeConfig.declareOption(
  'eth-ed25519-bin-path',
  'Path to the .bin file defining Ethereum ED25519 contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonybridge/dist/Ed25519.full.bin')
)
BridgeConfig.declareOption(
  'eth-client-lock-eth-amount',
  'Amount of Ether that should be temporarily locked when submitting a new header to EthClient, in wei.',
  '100000000000000000000'
)
BridgeConfig.declareOption(
  'eth-client-lock-duration',
  'The challenge window during which anyone can challenge an incorrect ED25519 signature of the Harmony block, in EthClient, in seconds.',
  14400
)
BridgeConfig.declareOption(
  'eth-client-replace-duration',
  'Minimum time difference required to replace a block during challenge period, in EthClient, in seconds.',
  18000
)
BridgeConfig.declareOption(
  'eth-client-address',
  'ETH address of the EthClient contract.'
)
BridgeConfig.declareOption(
  'eth-client-abi-path',
  'Path to the .abi file defining Ethereum Client contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonybridge/dist/HarmonyBridge.full.abi')
)
BridgeConfig.declareOption(
  'eth-client-bin-path',
  'Path to the .bin file defining Ethereum Client contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonybridge/dist/HarmonyBridge.full.bin')
)
BridgeConfig.declareOption(
  'eth-prover-address',
  'ETH address of the EthProver contract.'
)
BridgeConfig.declareOption(
  'eth-prover-abi-path',
  'Path to the .abi file defining Ethereum Prover contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonyprover/dist/HarmonyProver.full.abi')
)
BridgeConfig.declareOption(
  'eth-prover-bin-path',
  'Path to the .bin file defining Ethereum Prover contract.',
  path.join(LIBS_SOL_SRC_DIR, 'harmonyprover/dist/HarmonyProver.full.bin')
)
BridgeConfig.declareOption(
  'harmony2eth-relay-min-delay',
  'Minimum number of seconds to wait if the relay can\'t submit a block right away.',
  '1'
)
BridgeConfig.declareOption(
  'harmony2eth-relay-max-delay',
  'Maximum number of seconds to wait if the relay can\'t submit a block right away.',
  '600'
)
BridgeConfig.declareOption(
  'harmony2eth-relay-error-delay',
  'Number of seconds to wait before retrying if there is an error.',
  '1'
)
BridgeConfig.declareOption(
  'watchdog-delay',
  'Number of seconds to wait after validating all signatures.',
  '300'
)
BridgeConfig.declareOption(
  'watchdog-error-delay',
  'Number of seconds to wait before retrying if there is an error.',
  '1'
)
BridgeConfig.declareOption('harmony-erc20-account', 'Must be declared before set')

program.version('0.1.0')

// General-purpose commands.
// program.command('clean').action(CleanCommand.execute)

// BridgeConfig.addOptions(
//   program.command('prepare').action(PrepareCommand.execute),
//   ['core-src', 'harmonyup-src']
// )

// program.command('status').action(StatusCommand.execute)

// Maintainer commands.

const startCommand = program.command('start')

// startCommand.command('harmony-node').action(StartLocalHarmonyNodeCommand.execute)

// BridgeConfig.addOptions(
//   startCommand.command('ganache').action(StartGanacheNodeCommand.execute),
//   ['daemon']
// )

BridgeConfig.addOptions(
  startCommand
    .command('eth2harmony-relay')
    .action(StartEth2HmyRelayCommand.execute),
  [
    'harmony-master-account',
    'harmony-master-sk',
    'harmony-client-account',
    'harmony-network-id',
    'harmony-node-url',
    'daemon',
  ]
)

// BridgeConfig.addOptions(
//   startCommand
//     .command('harmony2eth-relay')
//     .action(StartHarmony2EthRelayCommand.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'harmony-node-url',
//     'harmony-network-id',
//     'eth-client-abi-path',
//     'eth-client-address',
//     'harmony2eth-relay-min-delay',
//     'harmony2eth-relay-max-delay',
//     'harmony2eth-relay-error-delay',
//     'eth-gas-multiplier',
//     'daemon',
//   ]
// )

// BridgeConfig.addOptions(
//   startCommand.command('bridge-watchdog').action(StartWatchdogCommand.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-client-abi-path',
//     'daemon',
//     'watchdog-delay',
//     'watchdog-error-delay',
//   ]
// )

const stopCommand = program.command('stop')

stopCommand.command('all').action(StopManagedProcessCommand.execute)

stopCommand.command('harmony-node').action(StopManagedProcessCommand.execute)

stopCommand.command('ganache').action(StopManagedProcessCommand.execute)

stopCommand.command('eth2harmony-relay').action(StopManagedProcessCommand.execute)

stopCommand.command('harmony2eth-relay').action(StopManagedProcessCommand.execute)

stopCommand.command('bridge-watchdog').action(StopManagedProcessCommand.execute)

// BridgeConfig.addOptions(
//   program
//     .command('init-harmony-contracts')
//     .description(
//       'Deploys and initializes Harmony Client and Harmony Prover contracts to NEAR blockchain.'
//     )
//     .action(InitHarmonyContracts.execute),
//   [
//     'harmony-network-id',
//     'harmony-node-url',
//     'eth-node-url',
//     'harmony-master-account',
//     'harmony-master-sk',
//     'harmony-client-account',
//     'harmony-client-sk',
//     'harmony-client-contract-path',
//     'harmony-client-init-balance',
//     'harmony-client-validate-ethash',
//     'harmony-client-trusted-signer',
//     'harmony-prover-account',
//     'harmony-prover-sk',
//     'harmony-prover-contract-path',
//     'harmony-prover-init-balance',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('init-eth-ed25519')
//     .description(
//       'Deploys and initializes ED25519 Solidity contract. It replaces missing precompile.'
//     )
//     .action(InitEthEd25519.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-ed25519-abi-path',
//     'eth-ed25519-bin-path',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('init-eth-client')
//     .description('Deploys and initializes EthClient.')
//     .action(InitEthClient.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-client-abi-path',
//     'eth-client-bin-path',
//     'eth-ed25519-address',
//     'eth-client-lock-eth-amount',
//     'eth-client-lock-duration',
//     'eth-client-replace-duration',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('init-eth-prover')
//     .description('Deploys and initializes EthProver.')
//     .action(InitEthProver.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-prover-abi-path',
//     'eth-prover-bin-path',
//     'eth-client-address',
//     'eth-gas-multiplier',
//   ]
// )

// // User commands.

// BridgeConfig.addOptions(
//   program
//     .command('init-harmony-token-factory')
//     .description(
//       'Deploys and initializes token factory to NEAR blockchain. Requires locker on Ethereum side.'
//     )
//     .action(InitHarmonyTokenFactory.execute),
//   [
//     'harmony-token-factory-account',
//     'harmony-token-factory-sk',
//     'harmony-token-factory-contract-path',
//     'harmony-token-factory-init-balance',
//     'eth-locker-address',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('deploy-token <token_name> <token_address>')
//     .description('Deploys and initializes token on NEAR.')
//     .action(DeployToken.execute),
//   ['harmony-token-factory-account']
// )

// BridgeConfig.addOptions(
//   program
//     .command('init-eth-locker')
//     .description(
//       'Deploys and initializes locker contract on Ethereum blockchain. Requires mintable fungible token on Harmony side.'
//     )
//     .action(InitEthLocker.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-locker-abi-path',
//     'eth-locker-bin-path',
//     'eth-erc20-address',
//     'harmony-token-factory-account',
//     'eth-prover-address',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('init-eth-erc20')
//     .description(
//       'Deploys and initializes ERC20 contract on Ethereum blockchain.'
//     )
//     .action(InitEthErc20.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-erc20-abi-path',
//     'eth-erc20-bin-path',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('transfer-eth-erc20-to-harmony')
//     .action(TransferETHERC20ToHarmony.execute)
//     .option('--amount <amount>', 'Amount of ERC20 tokens to transfer')
//     .option(
//       '--eth-sender-sk <eth_sender_sk>',
//       'The secret key of the Ethereum account that will be sending ERC20 token.'
//     )
//     .option(
//       '--harmony-receiver-account <harmony_receiver_account>',
//       'The account on NEAR blockchain that will be receiving the minted token.'
//     )
//     .option(
//       '--token-name <token_name>',
//       'Specific ERC20 token that is already bound by `deploy-token`.'
//     ),
//   [
//     'eth-node-url',
//     'eth-erc20-address',
//     'eth-erc20-abi-path',
//     'eth-locker-address',
//     'eth-locker-abi-path',
//     'harmony-node-url',
//     'harmony-network-id',
//     'harmony-token-factory-account',
//     'harmony-client-account',
//     'harmony-master-account',
//     'harmony-master-sk',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   program
//     .command('transfer-eth-erc20-from-harmony')
//     .action(TransferEthERC20FromHarmony.execute)
//     .option('--amount <amount>', 'Amount of ERC20 tokens to transfer')
//     .option(
//       '--harmony-sender-account <harmony_sender_account>',
//       'Harmony account that will be sending fungible token.'
//     )
//     .option(
//       '--harmony-sender-sk <harmony_sender_sk>',
//       'The secret key of Harmony account that will be sending the fungible token.'
//     )
//     .option(
//       '--eth-receiver-address <eth_receiver_address>',
//       'The account that will be receiving the token on Ethereum side.'
//     )
//     .option(
//       '--token-name <token_name>',
//       'Specific ERC20 token that is already bound by `deploy-token`.'
//     ),
//   [
//     'harmony-node-url',
//     'harmony-network-id',
//     'harmony-token-factory-account',
//     'eth-node-url',
//     'eth-erc20-address',
//     'eth-erc20-abi-path',
//     'eth-locker-address',
//     'eth-locker-abi-path',
//     'eth-client-abi-path',
//     'eth-client-address',
//     'eth-master-sk',
//     'eth-prover-abi-path',
//     'eth-prover-address',
//     'eth-gas-multiplier',
//   ]
// )

// Testing command
const dangerCommand = program
  .command('DANGER')
  .description(
    'Dangerous commands that should only be used for testing purpose.'
  )

// BridgeConfig.addOptions(
//   dangerCommand
//     .command('submit_invalid_harmony_block')
//     .description(
//       'Fetch latest harmony block, randomly mutate one byte and submit to HarmonyBridge'
//     )
//     .action(DangerSubmitInvalidHarmonyBlock.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'harmony-node-url',
//     'harmony-network-id',
//     'eth-client-abi-path',
//     'eth-client-address',
//     'harmony2eth-relay-min-delay',
//     'harmony2eth-relay-max-delay',
//     'harmony2eth-relay-error-delay',
//     'eth-gas-multiplier',
//   ]
// )

// BridgeConfig.addOptions(
//   dangerCommand
//     .command('deploy_test_erc20')
//     .description('Deploys MyERC20')
//     .action(DangerDeployMyERC20.execute),
//   [
//     'eth-node-url',
//     'eth-master-sk',
//     'eth-erc20-abi-path',
//     'eth-gas-multiplier',
//   ]
// )

// program
//   .command('eth-dump <kind_of_data>')
//   .option('--eth-node-url <eth_node_url>', 'ETH node API url')
//   .option('--path <path>', 'Dir path to dump eth data')
//   .option(
//     '--start-block <start_block>',
//     'Start block number (inclusive), default to be 4.3K blocks away from start block'
//   )
//   .option(
//     '--end-block <end_block>',
//     'End block number (inclusive), default to be latest block'
//   )
//   .action(ETHDump.execute)

// BridgeConfig.addOptions(
//   program
//     .command('harmony-dump <kind_of_data>')
//     .option('--path <path>', 'Dir path to dump harmony data')
//     .option(
//       '--num-blocks <num_blocks>',
//       'Number of blocks to dump, default: 100'
//     )
//     .action(HarmonyDump.execute),
//   ['harmony-node-url']
// )
;(async () => {
  await program.parseAsync(process.argv)
})()
