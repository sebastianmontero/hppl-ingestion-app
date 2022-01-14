const axios = require('axios').default
const { RequestMethod } = require('../../../src/const')
const { GeneratedBearerTokenRESTAuthHandler } = require('../../../src/domain/auth')
const { addBearerTokenHeader } = require('../../TestDataFunctions')

jest.setTimeout(20000)

jest.mock('axios')

describe('handleAuth method', () => {
  test('Verify auth cycle, including token cache and recovery after token expired error', async () => {
    const authHandler = new GeneratedBearerTokenRESTAuthHandler()
    let accessToken = 'token1'
    let url = 'http://auth.io'
    let credentials = {
      username: 'user1',
      password: 'password1',
      domain: 'LOCAL'
    }
    axios.mockResolvedValueOnce({
      data: {
        accessToken
      }
    })

    let authConfig = {
      url,
      credentials
    }
    let requestConfig = await authHandler.handleAuth(authConfig, {})
    let expectedRequestConfig = addBearerTokenHeader(accessToken)
    expect(requestConfig).toEqual(expectedRequestConfig)
    // Request to get access token should be performed the first time auth is called for specific auth config
    expect(axios).toHaveBeenCalledWith({
      method: RequestMethod.POST,
      url,
      data: credentials
    })

    axios.mockClear()
    requestConfig = await authHandler.handleAuth(authConfig, {})
    expect(requestConfig).toEqual(expectedRequestConfig)
    // Request to get access token should not be performed for subsequent calls, the cached token should be returned
    expect(axios).toHaveBeenCalledTimes(0)

    accessToken = 'token2'
    url = 'http://auth2.io'
    credentials = {
      username: 'user2',
      password: 'password2',
      domain: 'LOCAL'
    }

    authConfig = {
      url,
      credentials
    }

    axios.mockResolvedValueOnce({
      data: {
        accessToken
      }
    })

    requestConfig = await authHandler.handleAuth(authConfig, {})

    expectedRequestConfig = addBearerTokenHeader(accessToken)

    expect(requestConfig).toEqual(expectedRequestConfig)
    // Request to get access token should be performed the first time auth is called for a different auth config
    expect(axios).toHaveBeenCalledWith({
      method: RequestMethod.POST,
      url,
      data: credentials
    })
    axios.mockClear()
    requestConfig = await authHandler.handleAuth(authConfig, {})
    expect(requestConfig).toEqual(expectedRequestConfig)
    // Request to get access token should not be performed for subsequent calls, the cached token should be returned
    expect(axios).toHaveBeenCalledTimes(0)

    // Token cache should remain for error not related to auth
    let isRecoverableError = authHandler.isRecoverableAuthError({ message: 'non auth related error' }, authConfig)
    expect(isRecoverableError).toBe(false)
    requestConfig = await authHandler.handleAuth(authConfig, {})
    expect(requestConfig).toEqual(expectedRequestConfig)
    // Access token should not be requested the cached value should be returned
    expect(axios).toHaveBeenCalledTimes(0)

    // Token cache should be cleared for auth recoverable error, so that a new token is requested on next authHandle call
    isRecoverableError = authHandler.isRecoverableAuthError({ message: 'Request failed with status code 401' }, authConfig)
    expect(isRecoverableError).toBe(true)
    accessToken = 'token3'
    expectedRequestConfig = addBearerTokenHeader(accessToken)
    axios.mockResolvedValueOnce({
      data: {
        accessToken
      }
    })

    requestConfig = await authHandler.handleAuth(authConfig, {})
    expect(requestConfig).toEqual(expectedRequestConfig)
    // Request to get access token should be made as the cache should have been cleared
    expect(axios).toHaveBeenCalledWith({
      method: RequestMethod.POST,
      url,
      data: credentials
    })
  })
})
