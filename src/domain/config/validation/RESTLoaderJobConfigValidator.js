const { RequestMethod, RESTAuthMethod } = require('../../../const')
const ConfigValidator = require('./ConfigValidator')
const { ValidatorResultError, ValidationError } = require('jsonschema')

const schema = {
  type: 'object',
  properties: {
    method: {
      type: 'string',
      enum: Object.values(RequestMethod)
    },
    url: { type: 'string', format: 'uri' },
    params: {
      type: 'object',
      patternProperties: {
        "^[$a-zA-Z][a-zA-Z0-9/?:@\\-\\._~!$&'()*+,;=]+$": {
          type: ['integer', 'string', 'boolean']
        }
      },
      additionalProperties: false
    },
    data: {
      type: 'object',
      patternProperties: {
        "^[$a-zA-Z][a-zA-Z0-9/?:@\\-\\._~!$&'()*+,;=]+$": {
          type: ['any']
        }
      },
      additionalProperties: false
    },
    auth: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: Object.values(RESTAuthMethod)
        },
        credentialsVaultKey: { type: 'string' },
        url: { type: 'string', format: 'uri' }
      },
      required: [
        'method',
        'credentialsVaultKey'
      ]
    }
  },
  required: [
    'method',
    'url'
  ],
  additionalProperties: false
}

class RESTLoaderJobConfigValidator extends ConfigValidator {
  _getJobSpecificSchema () {
    return schema
  }

  _jobSpecificValidate (config) {
    const {
      method,
      data,
      auth
    } = config.job_specific_config
    const errors = []
    if (method === RequestMethod.GET && data != null) {
      errors.push(
        new ValidationError(
          'config with method: "get" should not have "data" property',
          config.job_specific_config,
          schema,
          'instance',
          'data',
          'data'
        )
      )
    }
    if (auth) {
      if (auth.method === RESTAuthMethod.GENERATED_BEARER_TOKEN && auth.url == null) {
        errors.push(
          new ValidationError(
            `auth config for method: "${RESTAuthMethod.GENERATED_BEARER_TOKEN}" should have "url" property specified`,
            config.job_specific_config,
            schema,
            'instance.auth',
            'auth',
            'auth'
          )
        )
      }
    }
    if (errors.length) {
      throw new ValidatorResultError({
        instance: config.job_specific_config,
        schema: schema,
        errors
      })
    }
  }
}

module.exports = RESTLoaderJobConfigValidator
