const Command = require('./Command')

class IngestionCommand extends Command {
  constructor (scheduler) {
    super()
    this.scheduler = scheduler
  }

  buildCommand (yargs) {
    yargs
      .usage('usage: $0 ingestion <operation>')
      .command('run', 'run ingestion process', {}, async (argv) => {
        await this.run(argv)
      })
      .demandCommand(1)
      .help('help')
      .updateStrings({
        'Commands:': 'operation:'
      })
      .wrap(null)
  }

  run (argv) {
    console.log('Running ingestion process...')
    this.scheduler.schedule()
  }
}

module.exports = IngestionCommand
