process.env.VAULT_SKIP_VERIFY = 1
const initVault = require('node-vault')
const Vault = require('./Vault')
const { WrappedError } = require('../../../error')

class HashiCorpVault extends Vault {
  constructor ({
    apiVersion,
    endpoint,
    roleId,
    secretId
  }) {
    super()
    this.endpoint = endpoint
    this.roleId = roleId
    this.secretId = secretId
    this.vault = initVault({
      apiVersion,
      endpoint
    })
  }

  async init () {
    await this.authenticate()
  }

  async authenticate () {
    try {
      const result = await this.vault.approleLogin({
        role_id: this.roleId,
        secret_id: this.secretId
      })
      // console.log('Authentication result: ', result)
      this.vault.token = result.auth.client_token
      // console.log('Token: ', this.vault.token)
    } catch (err) {
      throw new WrappedError('failed authenticating to the hashicorp vault', err)
    }
  }

  async read (key) {
    try {
      if (!this.vault.token) {
        throw new Error('init must be called before reading values from the hashicorp vault')
      }
      const response = await this.vault.read(key)
      // console.log('VAULT Response: ', response)
      return response.data
    } catch (err) {
      console.log('Read error: ', err)
      throw new WrappedError(`failed reading value for key: ${key}  from hashicorp vault`, err)
    }
  }

  async readAsArray (key, property) {
    try {
      const data = await this.read(key)
      if (!data[property]) {
        throw new Error(`No property: ${property} for key:${key}`)
      }
      return data[property].split(',')
    } catch (err) {
      console.log('Read error: ', err)
      throw new WrappedError('failed reading value as array from hashicorp vault', err)
    }
  }
}
module.exports = HashiCorpVault
