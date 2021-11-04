const config = require('config')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const CronTab = require('./domain/schedule')
const { BufferedLogApi, EOSApi, JobConfigApi, LogApi } = require('../../service')
const { JobConfig, Vault } = require('./domain/config')
const { Scheduler } = require('./domain/schedule')
const { VaultKey } = require('../../const')

async function start () {
  const eosEndpoint = config.get('eosEndpoint')
  const jobConfigContract = config.get('contractNames.jobConfig')
  const loggerContract = config.get('contractNames.logger')
  const eosApi = new EOSApi({
    endpoint: eosEndpoint,
    signatureProvider: await _getSignatureProvider()
  })

  const jobConfigApi = new JobConfigApi({
    contract: jobConfigContract,
    eosApi: eosApi
  })

  const logApi = new LogApi({
    contract: loggerContract,
    eosApi
  })
  const bufferedLogApi = new BufferedLogApi({
    logApi,
    intervalSeconds: config.get('bufferedLog.intervalSeconds')
  })

  const vault = new Vault()
  const jobConfig = new JobConfig({
    vault,
    jobConfigApi
  })

  const scheduler = new Scheduler({
    logApi: bufferedLogApi,
    jobConfig,
    cronTab: new CronTab()
  })
  scheduler.schedule()
}

async function _getSignatureProvider () {
  return new JsSignatureProvider(await _getContractKeys())
}

async function _getContractKeys () {
  const contractKeys = await this.vault.read(VaultKey.CONTRACT_KEYS)
  return contractKeys.keys
}

start()
