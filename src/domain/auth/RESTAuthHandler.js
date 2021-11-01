class RESTAuthHandler {
  async handleAuth (_authConfig, _requestConfig) {
    throw new Error('handleAuth method of the RESTAuthHandler class must be overriden by subclass')
  }

  /**
   * Must be overriden by subclass if there are auth errors that can be recovered from
   * ex. Token Expiration
   *
   * @param {Error} _error
   * @param {Object} _authConfig
   * @returns {boolean} whether the error is recoverable and new request to
   * handleAuth should be performed and the request retried
   */
  isRecoverableAuthError (_error, _authConfig) {
    return false
  }
}

module.exports = RESTAuthHandler
