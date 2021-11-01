const axios = require('axios').default
const { RequestMethod, RESTAuthMethod } = require('../../../src/const')
const { ExternalError, InternalError } = require('../../../src/error')
const { RESTLoaderJob } = require('../../../src/domain/job')
const { RESTAuthHandlerFactory, GeneratedBearerTokenRESTAuthHandler } = require('../../../src/domain/auth')
const { addBearerTokenHeader } = require('../../TestDataFunctions')

jest.setTimeout(20000)

jest.mock('axios')

beforeEach(async () => {
  axios.mockReset()
})

describe('_fetchPayload', () => {
  test('Successful Request without Authentication', async () => {
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
      job_specific_config: {
        method,
        url,
        params,
        data
      }
    }, {})
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(axios).toHaveBeenCalledWith(requestConfig)
  })

  test('Successful Request with Authentication', async () => {
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
    axios.mockResolvedValueOnce({ data: payload })
    const expectedPayload = await job._fetchPayload()
    expect(payload).toBe(expectedPayload)
    expect(RESTAuthHandlerFactory.getInstance).toHaveBeenCalledWith(auth.method)
    expect(authHandler.handleAuth).toHaveBeenCalledWith(auth, requestConfig)
    expect(axios).toHaveBeenCalledWith(expectedRequestConfig)
  })

  test('Recoverable authentication  error', async () => {
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
      response: {
        data: new Error('token expired')
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
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
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledWith(error.response.data, auth)
    expect(axios).toHaveBeenCalledTimes(2)
    expect(axios).toHaveBeenNthCalledWith(1, expectedRequestConfig1)
    expect(axios).toHaveBeenNthCalledWith(2, expectedRequestConfig2)
  })

  test('External authentication  error', async () => {
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
      response: {
        data: new Error('external error')
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
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
    expect(authHandler.isRecoverableAuthError).toHaveBeenCalledWith(error.response.data, auth)
  })

  test('Internal authentication  error', async () => {
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
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

  test('External fetch error', async () => {
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
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

  test('Internal fetch error', async () => {
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
      job_specific_config: {
        method,
        url,
        params,
        data,
        auth
      }
    }, {})
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
