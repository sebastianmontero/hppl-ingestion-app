const config = require('config')

config.getOr = function (setting, defualtValue) {
  return this.has(setting) ? this.get(setting) : defualtValue
}

module.exports = config
