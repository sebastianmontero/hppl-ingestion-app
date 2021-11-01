const axios = require('axios').default
const LoaderJob = require('./LoaderJob')
const { RESTAuthHandlerFactory } = require('../auth')
const { ExternalError, InternalError } = require('../../error')

class RESTLoaderJob extends LoaderJob {
  async _fetchPayload () {
    let authHandler
    const {
      method,
      url,
      params,
      data,
      auth
    } = this.config.job_specific_config
    let requestConfig = {
      method,
      url,
      params,
      data
    }
    try {
      if (auth) {
        authHandler = RESTAuthHandlerFactory.getInstance(auth.method)
        requestConfig = await authHandler.handleAuth(auth, requestConfig)
      }
      const response = await axios(requestConfig)
      return response.data
    } catch (error) {
      const errorMsg = `failed fetching payload for job: ${JSON.stringify(this.config, null, 4)}\n`
      if (error.response) {
        const { response } = error
        if (authHandler) {
          if (authHandler.isRecoverableAuthError(response.data, auth)) {
            return this._fetchPayload()
          } else {
            // Server error
            // errorMsg += `error: ${JSON.stringify(response, null, 4)}\n`
            // console.log(errorMsg)
            throw new ExternalError(errorMsg, error)
          }
        }
      } else if (error.request) {
        // Server error
        // errorMsg += `error: ${JSON.stringify(error.request, null, 4)}\n`
        throw new ExternalError(errorMsg, error)
      } else {
        // Error setting up request, code or config issue should rethrow
        throw new InternalError(errorMsg, error)
      }
    }
  }
}

module.exports = RESTLoaderJob
