const CacheFactory = require('../../CacheFactory')
const { SourceType } = require('../../../const')
const { InternalError } = require('../../../error')
const RESTLoaderJobConfigValidator = require('./RESTLoaderJobConfigValidator')

class ConfigValidatorFactory extends CacheFactory {
  _createInstance (sourceType) {
    switch (sourceType) {
      case SourceType.REST:
        return new RESTLoaderJobConfigValidator()
      default:
        throw new InternalError('No configuration validator for source type: ', sourceType)
    }
  }
}

module.exports = new ConfigValidatorFactory()
