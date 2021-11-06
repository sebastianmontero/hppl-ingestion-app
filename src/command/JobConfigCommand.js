const Command = require('./Command')

class JobConfigCommand extends Command {
  constructor (jobConfig) {
    super()
    this.jobConfig = jobConfig
  }

  buildCommand (yargs) {
    yargs
      .usage('usage: $0 job-config <operation>')
      .command('load <file> [options]', 'Load job configurations from file', function (yargs) {
        yargs
          .positional('file', {
            describe: 'JSON file that has the job configs to load',
            type: 'string'
          })
          .option('reset', {
            alias: 'r',
            type: 'boolean',
            default: false,
            describe: 'Clears the job table before loading new ones'
          })
      }, async (argv) => {
        await this.load(argv)
      })
      .command('list', 'List job configurations', {}, async (argv) => {
        await this.list(argv)
      })
      .command('delete', 'Delete job configurations', function (yargs) {
        yargs
          .option('ids', {
            type: 'array',
            describe: 'Job ids to delete',
            default: []
          })
          .option('all', {
            type: 'boolean',
            default: false,
            describe: 'Delete all jobs'
          })
      }, async (argv) => {
        await this.delete(argv, yargs)
      })
      .demandCommand(1)
      .help('help')
      .updateStrings({
        'Commands:': 'operation:'
      })
      .wrap(null)
  }

  async load (argv) {
    const {
      file,
      reset
    } = argv
    console.log(`Loading job configs from file: ${file}, resetting: ${reset}`)
    await this.jobConfig.loadJobConfigsFromFile(file, reset)
    console.log('Finished loading job configs')
  }

  async list (argv) {
    const jobConfigs = await this.jobConfig.jobConfigApi.getAll()
    if (jobConfigs.length) {
      console.log(`Job Configurations: \n ${JSON.stringify(jobConfigs, null, 4)}`)
    } else {
      console.log('There are no configured jobs')
    }
  }

  async delete (argv, yargs) {
    const {
      ids,
      all
    } = argv
    if (ids.length) {
      for (const id of ids) {
        console.log(`Deleting job with id: ${id}...`)
        await this.jobConfig.jobConfigApi.delete(id)
      }
      console.log('Finished deleting specified jobs...')
    } else if (all) {
      console.log('Deleting all jobs...')
      await this.jobConfig.jobConfigApi.reset()
      console.log('Finished deleting all jobs...')
    } else {
      yargs.showHelp()
    }
  }
}

module.exports = JobConfigCommand
