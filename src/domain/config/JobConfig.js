
const { ConfigValidatorFactory } = require('./validation')
const { StringUtil, Util, FSUtil } = require('../../util')
const { WrappedError } = require('../../error')

const VAULT_KEY_SUFIX = 'VaultKey'

class JobConfig {
  constructor ({
    vault,
    jobConfigApi
  }) {
    this.vault = vault
    this.jobConfigApi = jobConfigApi
  }

  async getJobConfigs () {
    let jobConfigs = await this.jobConfigApi.getAll()
    jobConfigs = await Promise.all(jobConfigs.map(async (jobConfig) => {
      try {
        jobConfig = this._validateJobConfig(jobConfig)
        await this._setSecrets(jobConfig)
        return jobConfig
      } catch (err) {
        throw new WrappedError('failed getting job configurations', err)
      }
    }))
    return jobConfigs
  }

  async loadJobConfigs (jobConfigs, clearFirst = false) {
    try {
      if (clearFirst) {
        await this.jobConfigApi.reset()
      }
      for (let jobConfig of jobConfigs) {
        if (!StringUtil.isString(jobConfig.job_specific_config)) {
          jobConfig = {
            ...jobConfig,
            job_specific_config: JSON.stringify(jobConfig.job_specific_config)
          }
        }
        this._validateJobConfig(jobConfig)
        await this.jobConfigApi.upsert(jobConfig)
      }
    } catch (err) {
      throw new WrappedError(`failed loading job configurations: ${JSON.stringify(jobConfigs, null, 4)}`, err)
    }
  }

  async loadJobConfigsFromFile (file, clearFirst = false) {
    try {
      const jobConfigs = await FSUtil.readJSON(file)
      await this.loadJobConfigs(jobConfigs, clearFirst)
    } catch (err) {
      throw new WrappedError(`failed loading job configurations from file:${file}`, err)
    }
  }

  _validateJobConfig (jobConfig) {
    const validator = ConfigValidatorFactory.getInstance(jobConfig.source_type)
    return validator.validate(jobConfig)
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
}

module.exports = JobConfig
