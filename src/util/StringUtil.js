
const Str = require('@supercharge/strings')

class StringUtil {
  static isString (value) {
    return Str.isString(value)
  }

  static replaceLast (value, search, replace) {
    return Str(value).replaceLast(search, replace)
  }
}

module.exports = StringUtil
