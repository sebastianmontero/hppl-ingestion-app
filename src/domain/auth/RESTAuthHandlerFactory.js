const CacheFactory = require('../CacheFactory')
const { RESTAuthMethod } = require('../../const')
const { InternalError } = require('../../error')
const GeneratedBearerTokenRESTAuthHandler = require('./GeneratedBearerTokenRESTAuthHandler')

class RESTAuthHandlerFactory extends CacheFactory {
  _createInstance (authMethod) {
    switch (authMethod) {
      case RESTAuthMethod.GENERATED_BEARER_TOKEN:
        return new GeneratedBearerTokenRESTAuthHandler()
      default:
        throw new InternalError('No REST Auth Handler for auth method: ', authMethod)
    }
  }
}

module.exports = new RESTAuthHandlerFactory()
