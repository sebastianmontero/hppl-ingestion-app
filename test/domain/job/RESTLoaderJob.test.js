const axios = require('axios').default
const { RequestMethod, RESTAuthMethod } = require('../../../src/const')
const { ExternalError, InternalError } = require('../../../src/error')
const { RESTLoaderJob } = require('../../../src/domain/job')
const { ValueFunctionResolver } = require('../../../src/domain')
const { RESTAuthHandlerFactory, GeneratedBearerTokenRESTAuthHandler } = require('../../../src/domain/auth')
const { addBearerTokenHeader } = require('../../TestDataFunctions')

jest.setTimeout(20000)

jest.mock('axios')

ValueFunctionResolver.getDate = function () {
  return new Date(1638974845786)
}

beforeEach(async () => {
  axios.mockReset()
})

describe('_fetchPayload method', () => {
  test('Verify successful POST Request without Authentication', async () => {
    const method = RequestMethod.POST
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1',
      param2: 'pvalue2'
    }
    const data = {
      data1: 'dvalue1',
      data2: 'dvalue2'
    }

    const payload = {
      prop1: 'value1'
    }
    const requestConfig = {
      method,
      url,
      params,
      data
    }
    RESTAuthHandlerFactory.getInstance = jest.fn()
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(axios).toHaveBeenCalledWith(requestConfig)
  })

  test('Verify successful GET Request without Authentication', async () => {
    const method = RequestMethod.GET
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const payload = {
      prop1: 'value1'
    }
    const requestConfig = {
      method,
      url,
      params
    }
    RESTAuthHandlerFactory.getInstance = jest.fn()
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(axios).toHaveBeenCalledWith(requestConfig)
  })

  test('Verify successful POST Request with Authentication', async () => {
    const method = RequestMethod.POST
    const accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }

    const payload = {
      prop1: 'value1'
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    const expectedRequestConfig = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.handleAuth.mockResolvedValueOnce(expectedRequestConfig)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValueOnce(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledWith(auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledWith(auth, requestConfig)
    expect(axios).toHaveBeenCalledWith(expectedRequestConfig)
  })

  test('Verify successful GET Request with Authentication', async () => {
    const method = RequestMethod.GET
    const accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }

    const payload = {
      prop1: 'value1'
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()

    const requestConfig = {
      method,
      url,
      params
    }
    const expectedRequestConfig = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.handleAuth.mockResolvedValueOnce(expectedRequestConfig)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValueOnce(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledWith(auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledWith(auth, requestConfig)
    expect(axios).toHaveBeenCalledWith(expectedRequestConfig)
  })

  test('Verify successful value function resolution in params', async () => {
    const method = RequestMethod.GET
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1',
      valueFn: '#{unixEpochOffset,50}#'
    }

    const payload = {
      prop1: 'value1'
    }
    const requestConfig = {
      method,
      url,
      params: {
        ...params,
        valueFn: 1638977845786000
      }
    }
    RESTAuthHandlerFactory.getInstance = jest.fn()
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(axios).toHaveBeenCalledWith(requestConfig)
  })

  test('Verify successful value function resolution in POST data', async () => {
    const method = RequestMethod.POST
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }

    const data = {
      data1: 'dvalue1',
      valueFn: '#{unixEpochOffset,-7}#'
    }

    const payload = {
      prop1: 'value1'
    }
    const requestConfig = {
      method,
      url,
      params,
      data: {
        ...data,
        valueFn: 1638974425786000
      }
    }
    RESTAuthHandlerFactory.getInstance = jest.fn()
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(axios).toHaveBeenCalledWith(requestConfig)
  })

  test('Verify internal error thrown during value function resolution is properly propagated', async () => {
    expect.assertions(2)
    const method = RequestMethod.POST
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }

    const data = {
      data1: 'dvalue1',
      valueFn: '#{nonExistant,-7}#'
    }

    RESTAuthHandlerFactory.getInstance = jest.fn()
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    try {
      await job._fetchPayload()
    } catch (error) {
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toContain('Value function with name: nonExistant does not exist')
    }
  })

  test('Verify can recover from token expired authentication error', async () => {
    const method = RequestMethod.POST
    let accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }

    const payload = {
      prop1: 'value1'
    }
    const error = {
      message: 'Request failed with status code 401',
      response: {
        data: ''
      }
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()
    authHandler.isRecoverableAuthError = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    const expectedRequestConfig1 = addBearerTokenHeader(accessToken, { ...requestConfig })
    accessToken = 'token2'
    const expectedRequestConfig2 = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.isRecoverableAuthError.mockReturnValueOnce(true)
    authHandler.handleAuth
      .mockResolvedValueOnce(expectedRequestConfig1)
      .mockResolvedValueOnce(expectedRequestConfig2)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockRejectedValueOnce(error).mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(2)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(2, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(2)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(2, auth, requestConfig)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledTimes(1)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledWith(error, auth)
    expect(axios).toHaveBeenCalledTimes(2)
    expect(axios).toHaveBeenNthCalledWith(1, expectedRequestConfig1)
    expect(axios).toHaveBeenNthCalledWith(2, expectedRequestConfig2)
  })

  test('Verify only retries once for token expired authentication error', async () => {
    const method = RequestMethod.POST
    let accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }

    const error = {
      message: 'Request failed with status code 401',
      response: {
        data: ''
      }
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()
    authHandler.isRecoverableAuthError = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    const expectedRequestConfig1 = addBearerTokenHeader(accessToken, { ...requestConfig })
    accessToken = 'token2'
    const expectedRequestConfig2 = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.isRecoverableAuthError.mockReturnValue(true)
    authHandler.handleAuth
      .mockResolvedValueOnce(expectedRequestConfig1)
      .mockResolvedValueOnce(expectedRequestConfig2)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockRejectedValue(error)
    try {
      await job._fetchPayload()
    } catch (err) {
      expect(err).toBeInstanceOf(ExternalError)
      expect(err.cause).toEqual(error)
    }
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(2)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(2, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(2)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(2, auth, requestConfig)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledTimes(1)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledWith(error, auth)
    expect(axios).toHaveBeenCalledTimes(2)
    expect(axios).toHaveBeenNthCalledWith(1, expectedRequestConfig1)
    expect(axios).toHaveBeenNthCalledWith(2, expectedRequestConfig2)
  })

  test('Verify external authentication error is properly handled', async () => {
    const method = RequestMethod.POST
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }
    const error = {
      message: 'Request failed with status code 401',
      response: {
        data: ''
      }
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()
    authHandler.isRecoverableAuthError = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    authHandler.isRecoverableAuthError.mockReturnValueOnce(false)
    authHandler.handleAuth
      .mockRejectedValueOnce(error)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    try {
      await job._fetchPayload()
    } catch (err) {
      expect(err).toBeInstanceOf(ExternalError)
      expect(err.cause).toEqual(error)
    }
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(1)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledTimes(1)
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledWith(error, auth)
  })

  test('Verify internal authentication error is properly reported', async () => {
    const method = RequestMethod.POST
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }
    const error = new Error('internal error')

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()
    authHandler.isRecoverableAuthError = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    authHandler.handleAuth
      .mockRejectedValueOnce(error)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    try {
      await job._fetchPayload()
    } catch (err) {
      expect(err).toBeInstanceOf(InternalError)
      expect(err.cause).toEqual(error)
    }
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(1)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
  })

  test('Verify external fetch error is properly handled', async () => {
    const method = RequestMethod.POST
    const accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }
    const error = {
      request: new Error('external error')
    }

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    const expectedRequestConfig1 = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.handleAuth
      .mockResolvedValueOnce(expectedRequestConfig1)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockRejectedValueOnce(error)
    try {
      await job._fetchPayload()
    } catch (err) {
      expect(err).toBeInstanceOf(ExternalError)
      expect(err.cause).toEqual(error)
    }
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(1)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
    expect(axios).toHaveBeenCalledTimes(1)
    expect(axios).toHaveBeenNthCalledWith(1, expectedRequestConfig1)
  })

  test('Verify internal fetch error is properly reported', async () => {
    const method = RequestMethod.POST
    const accessToken = 'token1'
    const url = 'http://api.io'
    const params = {
      param1: 'pvalue1'
    }
    const data = {
      data1: 'dvalue1'
    }
    const auth = {
      method: RESTAuthMethod.GENERATED_BEARER_TOKEN,
      url: 'http://auth.io',
      credentials: {
        username: 'user1',
        password: 'password1',
        domain: 'LOCAL'
      }
    }
    const error = new Error('external error')

    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    authHandler.handleAuth = jest.fn()

    const requestConfig = {
      method,
      url,
      params,
      data
    }
    const expectedRequestConfig1 = addBearerTokenHeader(accessToken, { ...requestConfig })
    authHandler.handleAuth
      .mockResolvedValueOnce(expectedRequestConfig1)
    RESTAuthHandlerFactory.getInstance = jest.fn()
    RESTAuthHandlerFactory.getInstance.mockReturnValue(authHandler)
    const job = new RESTLoaderJob({
      config: {
        job_specific_config: {
          method,
          url,
          params,
          data,
          auth
        }
      },
      logApi: {},
      valueFnResolver: ValueFunctionResolver
    })
    axios.mockRejectedValueOnce(error)
    try {
      await job._fetchPayload()
    } catch (err) {
      expect(err).toBeInstanceOf(InternalError)
      expect(err.cause).toEqual(error)
    }
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenNthCalledWith(1, auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledTimes(1)
    expect(authHandler.handleAuth).toHaveBeenNthCalledWith(1, auth, requestConfig)
    expect(axios).toHaveBeenCalledTimes(1)
    expect(axios).toHaveBeenNthCalledWith(1, expectedRequestConfig1)
  })
})
