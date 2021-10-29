const { ValidatorResultError } = require('jsonschema')
const { WrappedError } = require('../../../../src/error')
const { RESTLoaderJobConfigValidator } = require('../../../../src/domain/config/validation')
const { assertContainsError } = require('../../../TestAssertionFunctions')
const { getJobConfig } = require('../../../TestDataFunctions')

jest.setTimeout(20000)

let validator

beforeAll(async () => {
  validator = new RESTLoaderJobConfigValidator()
})

describe('Validate', () => {
  test('method and url are required properties', async () => {
    expect.assertions(5)
    const config = getJobConfig({ job_specific_config: '{}' })
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        expect(validationError.errors).toHaveLength(2)
        assertContainsError(validationError, 'requires property "method"')
        assertContainsError(validationError, 'requires property "url"')
      }

      config.job_specific_config = `{
        "method": "POST",
        "url": "http://www.test.com"
      }`
      validator.validate(config)
    }
  })
  test('method must GET or POST', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "INVALID",
      "url": "http://www.test.com"
    }`
    })

    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        // console.log(validationError)
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not one of enum values: GET,POST')
      }
    }
    config.job_specific_config = `{
      "method": "GET",
      "url": "http://www.test.com"
    }`
    validator.validate(config)
    config.job_specific_config = `{
      "method": "POST",
      "url": "http://www.test.com"
    }`
    validator.validate(config)
  })
  test('url must be valid uri', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "POST",
      "url": "asdasd"
    }`
    })

    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        // console.log(validationError)
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'does not conform to the "uri" format')
      }
    }
    config.job_specific_config = `{
      "method": "GET",
      "url": "http://www.google.com"
    }`
    validator.validate(config)
  })
  test('parameter names must conform to pattern', async () => {
    expect.assertions(6)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "POST",
      "url": "http://www.google.com",
      "parameters": {
        "invalid param": "value",
        "invalid{param": "value",
        "invalidparam#": "value"
      }
    }`
    })
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        // console.log(validationError)
        expect(validationError.errors).toHaveLength(3)
        assertContainsError(validationError, 'is not allowed to have the additional property "invalid param"')
        assertContainsError(validationError, 'is not allowed to have the additional property "invalid{param"')
        assertContainsError(validationError, 'is not allowed to have the additional property "invalidparam#"')
      }
    }
    config.job_specific_config = `{
      "method": "POST",
      "url": "http://www.google.com",
      "parameters": {
        "$param1/?:@-._~!$&'()*+,;=": "value"
      }
    }`
    validator.validate(config)
  })
  test('Auth method and credentialsVaultKey properties are required', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "POST",
      "url": "http://www.google.com",
      "auth": {
      }
    }`
    })

    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        // console.log(validationError)
        expect(validationError.errors).toHaveLength(2)
        assertContainsError(validationError, 'requires property "method"')
      }
    }
    config.job_specific_config = `{
      "method": "POST",
      "url": "http://www.google.com",
      "auth": {
        "method": "GeneratedBearerToken",
        "credentialsVaultKey": "key"
      }
    }`
    validator.validate(config)
  })

  test('Auth method must be GeneratedBearerToken', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "POST",
      "url": "http://www.google.com",
      "auth": {
        "method": "Invalid",
        "credentialsVaultKey": "key"
      }
    }`
    })
    try {
      validator.validate(config)
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.cause).toBeInstanceOf(ValidatorResultError)
      const validationError = err.cause
      if (validationError instanceof ValidatorResultError) {
        // console.log(validationError)
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'is not one of enum values: GeneratedBearerToken')
      }
    }
    config.job_specific_config = `{
      "method": "POST",
      "url": "http://www.google.com",
      "auth": {
        "method": "GeneratedBearerToken",
        "credentialsVaultKey": "key"
      }
    }`
    validator.validate(config)
  })
})
