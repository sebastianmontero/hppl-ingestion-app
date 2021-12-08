const { InternalError } = require('../error')
const { Util, StringUtil } = require('../util')

class ValueFunctionResolver {
  static resolve (obj) {
    if (!Util.isPlainObject(obj)) {
      return obj
    }
    const resolved = {}
    for (const [key, value] of Object.entries(obj)) {
      resolved[key] = Util.isPlainObject(value) ? this.resolve(value) : this.resolveValueFunction(value)
    }
    return resolved
  }

  static resolveValueFunction (value) {
    if (!StringUtil.isString(value) || !value.startsWith('#{') || !value.endsWith('}#')) {
      return value
    }
    const components = value.substring(2, value.length - 2).split(',')
    const fnName = components[0]
    if (!this[fnName]) {
      throw new InternalError(`Value function with name: ${fnName} does not exist`)
    }
    const params = components.splice(1)
    return this[fnName](...params)
  }

  static unixEpochOffset (offset) {
    const offsetNumber = Number(offset)
    if (!Number.isInteger(offsetNumber)) {
      throw new InternalError(`Offset parameter of unixEpochOffset must be an integer, provided: ${offset}`)
    }
    const d = this.getDate()
    d.setMinutes(d.getMinutes() + offsetNumber)
    return d.getTime() * 1000
  }

  static getDate () {
    return new Date()
  }
}

module.exports = ValueFunctionResolver
