const config = require('config')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const { ConfigValidatorFactory } = require('../../domain/config/validation')
const { EOSApi, JobsConfigApi, LogApi } = require('../../service')
const { StringUtil, Util } = require('../../util')
const { VaultKey } = require('../../const')

const VAULT_KEY_SUFIX = 'VaultKey'

class Config {
  constructor (vault) {
    this.vault = vault
  }

  async init () {
    const eosEndpoint = config.get('eosEndpoint')
    const jobsConfigContract = config.get('contractNames.jobsConfig')
    const loggerContract = config.get('contractNames.logger')
    this.eosApi = new EOSApi({
      endpoint: eosEndpoint,
      signatureProvider: await this._getSignatureProvider()
    })

    this.jobsConfigApi = new JobsConfigApi({
      contract: jobsConfigContract,
      eosApi: this.eosApi
    })

    this.logApi = new LogApi({
      contract: loggerContract,
      eosApi: this.eosApi
    })
  }

  async getJobConfigs () {
    let jobsConf = await this.jobsConfigApi.getAll()
    jobsConf = jobsConf.map((jobConf) => {
      try {
        const validator = ConfigValidatorFactory.getInstance(jobConf.source_type)
        return validator.validate(jobConf)
      } catch (err) {
        console.log(err.toString())
        throw err
      }
    })

    jobsConf = await Promise.all(jobsConf.map(async (jobConf) => {
      await this._setSecrets(jobConf)
      return jobConf
    }))
    return jobsConf
  }

  async _setSecrets (config) {
    for (const [key, value] of Object.entries(config)) {
      if (!value) {
        return
      }

      if (Util.isPlainObject(value)) {
        await this._setSecrets(value)
      } else if (StringUtil.isString(value) && key.endsWith(VAULT_KEY_SUFIX)) {
        config[StringUtil.replaceLast(key, VAULT_KEY_SUFIX, '')] = await this.vault.read(value)
        delete config[key]
      }
    }
  }

  getEOSApi () {
    return this.eosApi
  }

  getJobsConfigApi () {
    return this.jobsConfigApi
  }

  getLoggerApi () {
    return this.logApi
  }

  async _getSignatureProvider () {
    return new JsSignatureProvider(await this._getContractKeys())
  }

  async _getContractKeys () {
    const contractKeys = await this.vault.read(VaultKey.CONTRACT_KEYS)
    return contractKeys.keys
  }
}

module.exports = Config
