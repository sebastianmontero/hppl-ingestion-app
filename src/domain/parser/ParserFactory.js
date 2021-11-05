const CacheFactory = require('../CacheFactory')
const { ContentType } = require('../../const')
const { InternalError } = require('../../error')
const JSONParser = require('./JSONParser')

class ParserFactory extends CacheFactory {
  _createInstance (contentType) {
    switch (contentType) {
      case ContentType.JSON:
        return new JSONParser()
      default:
        throw new InternalError(`No parser for content type: ${contentType}`)
    }
  }
}

module.exports = new ParserFactory()
