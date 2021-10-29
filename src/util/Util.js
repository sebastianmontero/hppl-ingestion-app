const { isPlainObject } = require('is-plain-object')

class Util {
  static isPlainObject (value) {
    return isPlainObject(value)
  }
}

module.exports = Util
