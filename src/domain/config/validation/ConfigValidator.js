const { ValidatorResultError, Validator } = require('jsonschema')
const { ContentType, SourceType, SourceSystemType } = require('../../../const')
const { WrappedValidationError, WrappedError } = require('../../../error')

Validator.prototype.customFormats.cron = function (input) {
  return /(@(annually|yearly|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})/.test(input)
}

Validator.prototype.customFormats.json = function (input) {
  try {
    JSON.parse(input)
    return true
  } catch (err) {
    return false
  }
}

const schema = {
  type: 'object',
  properties: {
    job_name: { type: 'string', minLength: 3 },
    job_description: { type: 'string', minLength: 10 },
    source_type: { type: 'string', enum: Object.values(SourceType) },
    content_type: { type: 'string', enum: Object.values(ContentType) },
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
    'content_type',
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
      this.schemaValidator.validate(jobSpecificConfig, this._getJobSpecificSchema(), { throwAll: true })
      const parsedConfig = {
        ...config,
        job_specific_config: jobSpecificConfig
      }
      this._jobSpecificValidate(parsedConfig)
      return parsedConfig
    } catch (err) {
      let jobIdentifier = config.job_name || ''
      jobIdentifier += config.job_id != null ? `(${config.job_id})` : ''
      jobIdentifier += jobIdentifier ? ' ' : ''
      const msg = `Job ${jobIdentifier}validation failed`
      if (err instanceof ValidatorResultError) {
        throw new WrappedValidationError(msg, err)
      } else {
        throw new WrappedError(msg, err)
      }
    }
  }

  _getJobSpecificSchema () {
    throw new Error('getJobSpecificSchema method of the ConfigValidator must be overriden')
  }

  /**
    * To be overriden by subclass if it needs to perform additional job specific validations
    *
    * @param {Object} config job configuration
    */
  _jobSpecificValidate (config) {
  }
}

module.exports = ConfigValidator
