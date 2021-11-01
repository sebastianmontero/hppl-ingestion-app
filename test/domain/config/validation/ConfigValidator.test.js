const { ValidatorResultError } = require('jsonschema')
const { ContentType, SourceType, SourceSystemType } = require('../../../../src/const')
const { ConfigValidator } = require('../../../../src/domain/config/validation')
const { WrappedError } = require('../../../../src/error')
const { assertContainsError } = require('../../../TestAssertionFunctions')
const { getJobConfig } = require('../../../TestDataFunctions')

jest.setTimeout(20000)

let validator

beforeAll(async () => {
  validator = new ConfigValidator()
  validator._getJobSpecificSchema = function () {
    return {}
  }
})

describe('Validate', () => {
  test('All properties are required', async () => {
    let config = {}
    expect.assertions(12)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(10)
        assertContainsError(validationError, 'requires property "job_description"')
        assertContainsError(validationError, 'requires property "source_type"')
        assertContainsError(validationError, 'requires property "content_type"')
        assertContainsError(validationError, 'requires property "source_system_type"')
        assertContainsError(validationError, 'requires property "source_system_id"')
        assertContainsError(validationError, 'requires property "endpoint_id"')
        assertContainsError(validationError, 'requires property "schedule"')
        assertContainsError(validationError, 'requires property "index_fields"')
        assertContainsError(validationError, 'requires property "job_specific_config"')
      }
    }
    config = getJobConfig()
    validator.validate(config)
  })

  test('Job name min length', async () => {
    const config = getJobConfig({ job_name: 'na' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not meet minimum length')
      }
    }
    config.job_name = 'job'
    validator.validate(config)
  })

  test('Job description min length', async () => {
    const config = getJobConfig({ job_description: 'job' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not meet minimum length')
      }
    }

    config.job_description = 'job description'
    validator.validate(config)
  })

  test('Source Type must be a valid source type', async () => {
    const config = getJobConfig({ source_type: 'INVALID' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not one of enum values: REST')
      }
    }

    config.source_type = SourceType.REST
    validator.validate(config)
  })

  test('Content Type must be a valid content type', async () => {
    const config = getJobConfig({ content_type: 'INVALID' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not one of enum values: json')
      }
    }

    config.content_type = ContentType.JSON
    validator.validate(config)
  })

  test('Source System Type must be a valid souce system type', async () => {
    const config = getJobConfig({ source_system_type: 'INVALID' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not one of enum values: Cohesity')
      }
    }
    config.source_system_type = SourceSystemType.COHESITY
    validator.validate(config)
  })

  test('Schedule must be a valid cron expression', async () => {
    const config = getJobConfig({ schedule: '*' })
    expect.assertions(8)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not conform to the "cron" format')
      }
    }
    config.schedule = '1 2 3'
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not conform to the "cron" format')
      }
    }
    config.schedule = '* * * * *'
    validator.validate(config)

    config.schedule = '0 * * * *'
    validator.validate(config)

    config.schedule = '1-5 4 31 12 *'
    validator.validate(config)
  })

  test('Index fields must be an array of strings', async () => {
    const config = getJobConfig({ index_fields: 'INVALID' })
    expect.assertions(8)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not of a type(s) array')
      }
    }

    config.index_fields = [4]
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not of a type(s) string')
      }
    }
    config.index_fields = []
    validator.validate(config)

    config.index_fields = ['field1']
    validator.validate(config)

    config.index_fields = ['field1', 'field1']
    validator.validate(config)
  })

  test('Job Specific Config must be valid JSON', async () => {
    const config = getJobConfig({ job_specific_config: '{' })
    expect.assertions(4)
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      // console.log(validationError)
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not conform to the "json" format')
      }
    }

    config.job_specific_config = '{}'
    validator.validate(config)
  })

  test('Returns job specific config parsed', async () => {
    const config = getJobConfig({
      job_specific_config: `{
      "prop1": "string",
      "prop2": 10
    }`
    })
    const newConfig = validator.validate(config)
    const { prop1, prop2 } = newConfig.job_specific_config
    expect(prop1).toBe('string')
    expect(prop2).toBe(10)
  })
})
