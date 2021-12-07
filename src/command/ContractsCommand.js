const Command = require('./Command')
const path = require('path')

class ContractsCommand extends Command {
  constructor ({
    config,
    eosApi
  }) {
    super()
    this.config = config
    this.eosApi = eosApi
  }

  buildCommand (yargs) {
    yargs
      .usage('usage: $0 contracts <operation>')
      .command('deploy <dir>', 'Deploy contracts stored in the path specified by dir', function (yargs) {
        yargs
          .positional('dir', {
            describe: 'Path to the directory where the contract files are stored',
            type: 'string'
          })
          // .option('create', {
          //   alias: 'c',
          //   type: 'boolean',
          //   default: false,
          //   describe: 'Create the accounts to which the contracts are being deployed'
          // })
      }, async (argv) => {
        await this.deploy(argv)
      })
      .demandCommand(1)
      .help('help')
      .updateStrings({
        'Commands:': 'operation:'
      })
      .wrap(null)
  }

  async deploy (argv) {
    const {
      dir
      // create
    } = argv
    const contractNames = this.config.get('contract.names')

    console.log(`Deploying contracts in dir: ${dir} ...`)
    await this._deployContract(contractNames.jobConfig, dir, 'jobsconfig')
    await this._deployContract(contractNames.logger, dir, 'logger')
    console.log('Finished deploying contracts')
  }

  async _deployContract (account, dir, contract, create = false) {
    // if (create) {
    //   console.log(`Creating account: ${account} ...`)
    //   await this.eosApi.createAccount(account, PUBLIC_EOSIO_KEY, false)
    // }
    const contractPath = path.join(dir, contract)
    console.log(`Deploying: ${contractPath} to account: ${account} ...`)
    await this.eosApi.deployContract(account, `${contractPath}.wasm`, `${contractPath}.abi`)
  }
}

module.exports = ContractsCommand
