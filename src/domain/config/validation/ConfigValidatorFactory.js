const { SourceType } = require('../../../const')
const RESTLoaderJobConfigValidator = require('./RESTLoaderJobConfigValidator')

class ConfigValidatorFactory {
  static getValidator (sourceType) {
    if (!this.validators[sourceType]) {
      switch (sourceType) {
        case SourceType.REST:
          this.validators[sourceType] = new RESTLoaderJobConfigValidator()
          break
        default:
          throw new Error('No configuration validator for source type: ', sourceType)
      }
    }
    return this.validators[sourceType]
  }
}

ConfigValidatorFactory.validators = {}

module.exports = ConfigValidatorFactory
