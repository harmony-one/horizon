const ProcessManager = require('pm2')
const { spawnProcess } = require('./helpers')
const { Eth2HmyRelay } = require('../../eth2hmy-relay/eth2hmy-relay')
const { BridgeConfig } = require('../../harmony-bridge-lib/config')
const path = require('path')
const os = require('os')

class StartEth2HmyRelayCommand {
  static async execute() {
    
    //correct his later, disable daemon mode by default for now
    // if (BridgeConfig.getParam('daemon') === 'false') {
    if(false){  
    ProcessManager.connect((err) => {
        if (err) {
          console.log(
            'Unable to connect to the ProcessManager daemon! Please retry.'
          )
          return
        }
        spawnProcess('eth2Hmy-relay', {
          name: 'eth2Hmy-relay',
          script: path.join(__dirname, '../../index.js'),
          interpreter: 'node',
          error_file: '~/.harmony-bridge/logs/eth2hmy-relay/err.log',
          out_file: '~/.harmony-bridge/logs/eth2hmy-relay/out.log',
          args: ['start', 'eth2hmy-relay', ...BridgeConfig.getArgsNoDaemon()],
          wait_ready: true,
          kill_timeout: 60000,
          logDateFormat: 'YYYY-MM-DD HH:mm:ss.SSS',
        })
      })
    } else {
      
      const relay = new Eth2HmyRelay()
      relay.initialize()
      console.log('Starting eth2hmy-relay...')
      await relay.run()
    }
  }
}

exports.StartEth2HmyRelayCommand = StartEth2HmyRelayCommand
