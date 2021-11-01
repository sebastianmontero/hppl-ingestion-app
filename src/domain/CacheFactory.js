class CacheFactory {
  constructor () {
    this.cache = {}
  }

  getInstance (key) {
    if (!this.cache[key]) {
      this.cache[key] = this._createInstance(key)
    }
    return this.cache[key]
  }

  _createInstance (key) {
    throw new Error('_createInstance method of CacheFactory must be overriden')
  }
}

module.exports = CacheFactory
