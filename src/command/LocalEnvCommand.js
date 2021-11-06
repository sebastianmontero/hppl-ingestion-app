const sleep = require('await-sleep')
const Command = require('./Command')
const { testSetupHelper } = require('../../test/TestSetupHelper')

class LocalEnvCommand extends Command {
  buildCommand (yargs) {
    yargs
      .usage('usage: $0 local-env <operation>')
      .command('start', 'start local nodeos environment', {}, async (argv) => {
        await this.start(argv)
      })
      .command('stop', 'stop local nodeos environment', {}, async (argv) => {
        await this.stop(argv)
      })
      .demandCommand(1)
      .help('help')
      .updateStrings({
        'Commands:': 'operation:'
      })
      .wrap(null)
  }

  async start (argv) {
    console.log('Starting and setting up local nodeos env...')
    await testSetupHelper.setupNodeos()
    await sleep(3000)
    console.log('Started local nodeos env')
  }

  async stop (argv) {
    console.log('Stopping local env...')
    await testSetupHelper.stopNodeos()
    console.log('Stopped local nodeos env')
  }
}

module.exports = LocalEnvCommand
