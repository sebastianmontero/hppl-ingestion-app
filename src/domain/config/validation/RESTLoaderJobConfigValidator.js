const ConfigValidator = require('./ConfigValidator')

const schema = {
  type: 'object',
  properties: {
    method: {
      type: 'string',
      enum: ['GET', 'POST']
    },
    url: { type: 'string', format: 'uri' },
    parameters: {
      type: 'object',
      patternProperties: {
        "^[$a-zA-Z][a-zA-Z0-9/?:@\\-\\._~!$&'()*+,;=]+$": {
          type: ['integer', 'string', 'boolean']
        }
      },
      additionalProperties: false
    },
    auth: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GeneratedBearerToken']
        },
        credentialsVaultKey: { type: 'string' }
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
  ]
}

class RESTLoaderJobConfigValidator extends ConfigValidator {
  getJobSpecificSchema () {
    return schema
  }
}

module.exports = RESTLoaderJobConfigValidator
