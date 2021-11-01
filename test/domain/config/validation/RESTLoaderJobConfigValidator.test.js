const { ValidatorResultError } = require('jsonschema')
const { RequestMethod, RESTAuthMethod } = require('../../../../src/const')
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
        "method": "${RequestMethod.POST}",
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
        assertContainsError(validationError, 'is not one of enum values: get,post')
      }
    }
    config.job_specific_config = `{
      "method": "${RequestMethod.GET}",
      "url": "http://www.test.com"
    }`
    validator.validate(config)
    config.job_specific_config = `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.test.com"
    }`
    validator.validate(config)
  })
  test('url must be valid uri', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
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
      "method": "${RequestMethod.GET}",
      "url": "http://www.google.com"
    }`
    validator.validate(config)
  })
  test('param names must conform to pattern', async () => {
    expect.assertions(6)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "params": {
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
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "params": {
        "$param1/?:@-._~!$&'()*+,;=": "value"
      }
    }`
    validator.validate(config)
  })
  test('params must be of valid type', async () => {
    expect.assertions(5)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "params": {
        "invalidParamArray": ["value"],
        "invalidParamDouble": 10.9
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
        assertContainsError(validationError, 'instance.params.invalidParamArray is not of a type(s) integer,string,boolean')
        assertContainsError(validationError, 'instance.params.invalidParamDouble is not of a type(s) integer,string,boolean')
      }
    }
    config.job_specific_config = `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "params": {
        "param1": "value",
        "param2": 10,
        "param3": true
      }
    }`
    validator.validate(config)
  })

  test('data names must conform to pattern', async () => {
    expect.assertions(6)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "data": {
        "invalid data": "value",
        "invalid{data": "value",
        "invaliddata#": "value"
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
        assertContainsError(validationError, 'is not allowed to have the additional property "invalid data"')
        assertContainsError(validationError, 'is not allowed to have the additional property "invalid{data"')
        assertContainsError(validationError, 'is not allowed to have the additional property "invaliddata#"')
      }
    }
    config.job_specific_config = `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "data": {
        "$data1/?:@-._~!$&'()*+,;=": "value"
      }
    }`
    validator.validate(config)
  })

  test('config of method get should not have data property', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.GET}",
      "url": "http://www.google.com",
      "data": {
        "data1": "value"
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
        assertContainsError(validationError, 'config with method: "get" should not have "data" property')
      }
    }
  })

  test('Auth method and credentialsVaultKey properties are required', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
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
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "auth": {
        "method": "GeneratedBearerToken",
        "credentialsVaultKey": "key",
        "url":"http://auth.io"
      }
    }`
    validator.validate(config)
  })

  test('Auth method must be a valid auth method', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
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
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "auth": {
        "method": "${RESTAuthMethod.GENERATED_BEARER_TOKEN}",
        "credentialsVaultKey": "key",
        "url":"http://auth.io"
      }
    }`
    validator.validate(config)
  })

  test(`Auth config for method ${RESTAuthMethod.GENERATED_BEARER_TOKEN} must have url property specified`, async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "auth": {
        "method": "${RESTAuthMethod.GENERATED_BEARER_TOKEN}",
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
        assertContainsError(validationError, `auth config for method: "${RESTAuthMethod.GENERATED_BEARER_TOKEN}" should have "url" property specified`)
      }
    }
    config.job_specific_config = `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "auth": {
        "method": "${RESTAuthMethod.GENERATED_BEARER_TOKEN}",
        "credentialsVaultKey": "key",
        "url":"http://auth.io"
      }
    }`
    validator.validate(config)
  })

  test('Auth url property must be valid uri', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "auth": {
        "method": "${RESTAuthMethod.GENERATED_BEARER_TOKEN}",
        "credentialsVaultKey": "key",
        "url": "invalid"
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
        console.log(validationError)
        expect(validationError.errors).toHaveLength(1)
        assertContainsError(validationError, 'instance.auth.url does not conform to the "uri" format')
      }
    }
  })

  test('config must not have additional properties', async () => {
    expect.assertions(4)
    const config = getJobConfig({
      job_specific_config: `{
      "method": "${RequestMethod.POST}",
      "url": "http://www.google.com",
      "additionalProp": "value"
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
        assertContainsError(validationError, 'is not allowed to have the additional property "additionalProp"')
      }
    }
  })
})
