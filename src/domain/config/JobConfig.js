
const { ConfigValidatorFactory } = require('./validation')
const { StringUtil, Util } = require('../../util')

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
    let jobsConf = await this.jobConfigApi.getAll()
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
}

module.exports = JobConfig
