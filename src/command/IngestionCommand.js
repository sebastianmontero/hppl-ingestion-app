const Command = require('./Command')

class IngestionCommand extends Command {
  constructor ({
    config,
    scheduler,
    jobConfig
  }) {
    super()
    this.config = config
    this.scheduler = scheduler
    this.jobConfig = jobConfig
  }

  buildCommand (yargs) {
    yargs
      .usage('usage: $0 ingestion <operation>')
      .command('run [options]', 'run ingestion process', function (yargs) {
        yargs
          .option('jobConfig', {
            alias: 'j',
            type: 'string',
            describe: 'Path to a json file with job configurations to load, the table is cleard before loading the jobs'
          })
      }, async (argv) => {
        await this.run(argv)
      })
      .demandCommand(1)
      .help('help')
      .updateStrings({
        'Commands:': 'operation:'
      })
      .wrap(null)
  }

  async run (argv) {
    let {
      jobConfig
    } = argv
    if (!jobConfig) {
      if (this.config.has('jobConfig.file')) {
        jobConfig = this.config.get('jobConfig.file')
      }
    }
    if (jobConfig) {
      console.log(`Reloading job configs from file: ${jobConfig}`)
      await this.jobConfig.loadJobConfigsFromFile(jobConfig, true)
    }
    console.log('Running ingestion process...')
    this.scheduler.schedule()
  }
}

module.exports = IngestionCommand
