const axios = require('axios').default
const RESTAuthHandler = require('./RESTAuthHandler')
const { RequestMethod } = require('../../const')

class GeneratedBearerTokenRESTAuthHandler extends RESTAuthHandler {
  constructor () {
    super()
    this.tokens = {}
  }

  async handleAuth (authConfig, requestConfig) {
    const {
      url,
      credentials,
      credentials: {
        username
      }
    } = authConfig
    if (!this.tokens[url]) {
      this.tokens[url] = {}
    }
    if (!this.tokens[url][username]) {
      this.tokens[url][username] = this._requestToken(url, credentials)
    }
    const tokenPromise = this.tokens[url][username]
    const token = await tokenPromise
    if (!authConfig.headers) {
      authConfig.headers = {}
    }
    requestConfig.headers = {
      Authorization: `Bearer ${token}`
    }
    return requestConfig
  }

  isRecoverableAuthError (error, authConfig) {
    if (error.message && error.message.toLowerCase().includes('token expired')) {
      const {
        url,
        credentials: {
          username
        }
      } = authConfig
      if (this.tokens[url] && this.tokens[url][username]) {
        delete this.tokens[url][username]
      }
      return true
    }
    return false
  }

  async _requestToken (url, credentials) {
    const { data: { accessToken } } = await axios({
      method: RequestMethod.POST,
      url,
      data: credentials
    })
    return accessToken
  }
}

module.exports = GeneratedBearerTokenRESTAuthHandler
