const config = require('../../config.js')
const Logger = {
    debug: (...args) => {
        if (config.verbose) {
            console.log(...args)
        }
    }
}

module.exports = { Logger }
