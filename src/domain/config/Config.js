const config = require('config')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const { ConfigValidatorFactory } = require('../../domain/config/validation')
const { EOSApi, JobsConfigApi, LogApi } = require('../../service')

class Config {
  constructor () {
    const eosEndpoint = config.get('eosEndpoint')
    const jobsConfigContract = config.get('contractNames.jobsConfig')
    const loggerContract = config.get('contractNames.logger')
    this.eosApi = new EOSApi({
      endpoint: eosEndpoint,
      signatureProvider: this.getSignatureProvider()
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

  async getJobsConfig () {
    const jobsConf = this.jobsConfigApi.getAll()
    for (const jobConf of jobsConf) {
      const validator = ConfigValidatorFactory.getValidator(jobConf.source_type)
      validator.validate(jobConf)
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

  getSignatureProvider () {
    return new JsSignatureProvider(this.getContractKeys())
  }

  getContractKeys () {
    return ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']
  }
}

module.exports = Config
