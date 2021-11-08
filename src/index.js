const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

process.env.NODE_ENV = getEnv()
const config = require('config')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')

const { CronTab } = require('./domain/schedule')
const { BufferedLogApi, EOSApi, JobConfigApi, LogApi, FileQueue } = require('./service')
const { JobConfig } = require('./domain/config')
const { DummyVault, HashiCorpVault } = require('./domain/config/vault')
const { Scheduler } = require('./domain/schedule')
const { LocalEnvCommand, JobConfigCommand, IngestionCommand } = require('./command')

async function start () {
  const eosEndpoint = config.get('eosEndpoint')
  const jobConfigContract = config.get('contract.names.jobConfig')
  const loggerContract = config.get('contract.names.logger')
  let vault
  if (useDummyVault()) {
    console.log('Using dummy vault')
    vault = new DummyVault()
  } else {
    vault = new HashiCorpVault(config.get('vault'))
  }
  await vault.init()
  const eosApi = new EOSApi({
    endpoint: eosEndpoint,
    signatureProvider: await getSignatureProvider(vault)
  })

  const jobConfigApi = new JobConfigApi({
    contract: jobConfigContract,
    eosApi: eosApi
  })

  const logApi = new LogApi({
    contract: loggerContract,
    eosApi
  })

  const queue = new FileQueue(config.get('bufferedLog.queuePath'))

  const bufferedLogApi = new BufferedLogApi({
    logApi,
    queue,
    intervalSeconds: config.get('bufferedLog.intervalSeconds')
  })
  const jobConfig = new JobConfig({
    vault,
    jobConfigApi
  })

  const scheduler = new Scheduler({
    logApi: bufferedLogApi,
    jobConfig,
    cronTab: new CronTab()
  })

  const localEnvCommand = new LocalEnvCommand()
  const jobConfigCommand = new JobConfigCommand(jobConfig)
  const ingestionCommand = new IngestionCommand(scheduler)
  // eslint-disable-next-line no-unused-vars
  const argv = yargs(hideBin(process.argv))
    .strict()
    .usage('usage: $0 <command>')
    .option('env', {
      alias: 'e',
      type: 'string',
      default: 'test',
      describe: 'environment to operate on, used to determine which config file to read'
    })
    .option('dummyVault', {
      type: 'boolean',
      default: false,
      describe: 'If specified the dummy vault is used'
    })
    .command('local-env', 'Start, stop and restart local nodeos environment', function (yargs) {
      localEnvCommand.buildCommand(yargs)
    })
    .command('job-config', 'Load, reload, list and delete job configs', function (yargs) {
      jobConfigCommand.buildCommand(yargs)
    })
    .command('ingestion', 'Manage ingestion process', function (yargs) {
      ingestionCommand.buildCommand(yargs)
    })
    .demandCommand(1)
    .help('help')
    .wrap(null)
    .argv
}

async function getSignatureProvider (vault) {
  return new JsSignatureProvider(await getContractKeys(vault))
}

async function getContractKeys (vault) {
  return await vault.readAsArray(config.get('contract.keysVaultKey'), 'keys')
}

function getEnv () {
  return yargs(hideBin(process.argv))
    .option('env', {
      alias: 'e',
      type: 'string',
      default: 'test'
    }).argv.env
}

function useDummyVault () {
  return yargs(hideBin(process.argv))
    .option('dummyVault', {
      type: 'boolean',
      default: false,
      describe: 'If specified the dummy vault is used'
    }).argv.dummyVault
}

start()
