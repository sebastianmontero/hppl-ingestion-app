const { Validator } = require('jsonschema')
const { SourceType, SourceSystemType } = require('../../../const')
const { WrappedError } = require('../../../error')

Validator.prototype.customFormats.cron = function (input) {
  return /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/.test(input)
}

Validator.prototype.customFormats.json = function (input) {
  try {
    JSON.parse(input)
    return true
  } catch (error) {
    return false
  }
}

const schema = {
  type: 'object',
  properties: {
    job_name: { type: 'string', minLength: 3 },
    job_description: { type: 'string', minLength: 10 },
    source_type: { type: 'string', enum: Object.values(SourceType) },
    source_system_type: { type: 'string', enum: Object.values(SourceSystemType) },
    source_system_id: { type: 'string' },
    endpoint_id: { type: 'string' },
    schedule: { type: 'string', format: 'cron' },
    index_fields: {
      type: 'array',
      items: { type: 'string' }
    },
    job_specific_config: { type: 'string', format: 'json' }
  },
  required: [
    'job_name',
    'job_description',
    'source_type',
    'source_system_type',
    'source_system_id',
    'endpoint_id',
    'schedule',
    'index_fields',
    'job_specific_config'
  ]

}

class ConfigValidator {
  constructor () {
    this.schemaValidator = new Validator()
  }

  validate (config) {
    try {
      this.schemaValidator.validate(config, schema, { throwAll: true })
      const jobSpecificConfig = JSON.parse(config.job_specific_config)
      this.schemaValidator.validate(jobSpecificConfig, this.getJobSpecificSchema(), { throwAll: true })
      return {
        ...config,
        job_specific_config: jobSpecificConfig
      }
    } catch (err) {
      let jobIdentifier = config.job_name || ''
      jobIdentifier += config.job_id != null ? `(${config.job_id})` : ''
      jobIdentifier += jobIdentifier ? ' ' : ''
      throw new WrappedError(`Job ${jobIdentifier}validation failed`, err)
    }
  }

  getJobSpecificSchema () {
    throw new Error('getJobSpecificSchema method of the ConfigValidator must be overriden')
  }
}

module.exports = ConfigValidator
