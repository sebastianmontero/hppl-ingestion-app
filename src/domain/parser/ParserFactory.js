const { ContentType } = require('../../const')
const JSONParser = require('./JSONParser')

class ParserFactory {
  static getParser (contentType) {
    if (!this.parsers[contentType]) {
      switch (contentType) {
        case ContentType.JSON:
          this.parsers[contentType] = new JSONParser()
          break
        default:
          throw new Error('No parser for content type: ', contentType)
      }
    }
  }
}

ParserFactory.parsers = {}

module.exports = ParserFactory
