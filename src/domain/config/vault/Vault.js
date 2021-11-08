class Vault {
  async init () {}
  async read (key) {
    throw new Error('read method of the Vault class should be overriden by subclass')
  }

  async readAsArray (key, property) {
    throw new Error('readAsArray method of the Vault class should be overriden by subclass')
  }
}
module.exports = Vault
