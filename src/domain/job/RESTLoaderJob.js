const axios = require('axios').default
const LoaderJob = require('./LoaderJob')
const { RESTAuthHandlerFactory } = require('../auth')
const { ExternalError, InternalError } = require('../../error')
const { logger } = require('../../service')

class RESTLoaderJob extends LoaderJob {
  async _fetchPayload (retries = 1) {
    let authHandler
    let {
      method,
      url,
      params,
      data,
      auth
    } = this.config.job_specific_config

    params = this.valueFnResolver.resolve(params)
    data = this.valueFnResolver.resolve(data)
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
      logger.info(`Error object: ${JSON.stringify(error, null, 4)}`)
      if (error.response) {
        const { response } = error
        logger.info(`Error object response: ${JSON.stringify(response, null, 4)}`)
        if (authHandler) {
          if (retries > 0 && authHandler.isRecoverableAuthError(response.data, auth)) {
            return this._fetchPayload(retries - 1)
          } else {
            // Server error
            // errorMsg += `error: ${JSON.stringify(response, null, 4)}\n`
            // console.log(errorMsg)
            throw new ExternalError(errorMsg, error)
          }
        }
      } else if (error.request) {
        logger.info(`Error object request: ${JSON.stringify(error.request, null, 4)}`)
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
