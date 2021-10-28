const fs = require('fs')
const { Api, JsonRpc, Serialize } = require('eosjs')
const fetch = require('node-fetch')
const { TextDecoder, TextEncoder } = require('util')
const { WrappedError } = require('../error')

const retryableErrors = [
  'connection reset by peer',
  'Transaction took too long',
  'exceeded the current CPU usage limit',
  'ABI serialization time has exceeded'
]

class EOSApi {
  constructor ({
    endpoint,
    signatureProvider
  }) {
    const rpc = new JsonRpc(endpoint, { fetch })
    this.api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() })
    this.rpc = rpc
  }

  async trx (actions, defaultAuthorization = null, retries = 5) {
    // console.log(JSON.stringify({
    //   actions: this._formatActions(actions)
    // }, null, 4))
    try {
      const transaction = await this.api.transact(
        {
          actions: this._formatActions(actions, defaultAuthorization)
        },
        {
          blocksBehind: 3,
          expireSeconds: 30
        }
      )
      return transaction
    } catch (err) {
      console.log('TRX ERROR: ', err)
      let error = err
      const { cause } = err
      while (error.cause) {
        error = cause
      }
      error = new Error(error.message || error)
      if (retries > 0 && this.isRetryableError(error.message)) {
        return this.trx(actions, retries - 1)
      }
      throw error
    }
  }

  async simpleTrx ({
    account,
    name,
    data,
    authorization
  }, retries = 5) {
    return this.trx([
      {
        account,
        name,
        data,
        authorization
      }
    ], retries)
  }

  async getKVTableRows ({
    json = true,
    code,
    table,
    indexName,
    lowerBound,
    upperBound,
    limit,
    reverse = false,
    showPayer = false
  }) {
    return this.rpc.get_kv_table_rows({
      json,
      code,
      table,
      index_name: indexName,
      lower_bound: lowerBound,
      upper_bound: upperBound,
      limit,
      reverse,
      show_payer: showPayer
    })
  }

  async getSingleKVTableRow ({
    json = true,
    code,
    table,
    indexName,
    lowerBound,
    upperBound,
    reverse = false,
    showPayer = false
  }) {
    const results = await this.getKVTableRows({
      json,
      code,
      table,
      indexName,
      lowerBound,
      upperBound,
      limit: 1,
      reverse,
      showPayer
    })
    return results.rows && results.rows.length ? results.rows[0] : null
  }

  async getAllKVTableRows ({
    json = true,
    code,
    table,
    indexName,
    lowerBound,
    upperBound,
    showPayer = false
  }) {
    let allRows = []
    let rows = null
    let more = null
    let nextKey = null
    do {
      ({ rows, more, next_key: nextKey } = await this.getKVTableRows({
        json,
        code,
        table,
        indexName,
        lowerBound,
        upperBound,
        limit: 1000,
        showPayer
      }))
      if (more) {
        lowerBound = nextKey
      }
      allRows = allRows.concat(rows)
    } while (more)

    return allRows
  }

  async createAccount (newAccount, publicKey, failIfExists = false) {
    try {
      await this.simpleTrx({
        account: 'eosio',
        name: 'newaccount',
        data: {
          creator: 'eosio',
          name: newAccount,
          owner: {
            threshold: 1,
            keys: [{
              key: publicKey,
              weight: 1
            }],
            accounts: [],
            waits: []
          },
          active: {
            threshold: 1,
            keys: [{
              key: publicKey,
              weight: 1
            }],
            accounts: [],
            waits: []
          }
        },
        authorization: [{
          actor: 'eosio',
          permission: 'active'
        }]
      })
    } catch (err) {
      if (failIfExists || !err.message.includes('name is already taken')) {
        throw err
      }
    }
    return newAccount
  }

  async deployContract (account, wasmFile, abiFile) {
    try {
      const wasm = this._readWasm(wasmFile)
      const abi = this._readAbi(abiFile)
      await this.trx([
        {
          account: 'eosio',
          name: 'setcode',
          authorization: [
            {
              actor: account,
              permission: 'active'
            }
          ],
          data: {
            account,
            vmtype: 0,
            vmversion: 0,
            code: wasm
          }
        },
        {
          account: 'eosio',
          name: 'setabi',
          authorization: [
            {
              actor: account,
              permission: 'active'
            }
          ],
          data: {
            account,
            abi: abi
          }
        }
      ])
    } catch (err) {
      throw new WrappedError('Failed deploying contract', err)
    }
  }

  _formatActions (actions, defaultAuthorization = null) {
    const formatted = []
    for (const action of actions) {
      formatted.push(this._formatAction(action, defaultAuthorization))
    }
    return formatted
  }

  _formatAction ({ account, name, data, authorization }, defaultAuthorization = null) {
    authorization = authorization || defaultAuthorization
    if (!Array.isArray(authorization)) {
      authorization = [
        {
          actor: authorization,
          permission: 'active'
        }
      ]
    }
    return {
      account,
      name,
      authorization,
      data
    }
  }

  _readWasm (wasmFile) {
    try {
      return fs.readFileSync(wasmFile).toString('hex')
    } catch (err) {
      throw new WrappedError('Failed reading WASM', err)
    }
  }

  _readAbi (abiFile) {
    try {
      const buffer = new Serialize.SerialBuffer({
        textEncoder: this.api.textEncoder,
        textDecoder: this.api.textDecoder
      })

      let abiJSON = JSON.parse(fs.readFileSync(abiFile, 'utf8'))
      const abiDefinitions = this.api.abiTypes.get('abi_def')

      abiJSON = abiDefinitions.fields.reduce(
        (acc, { name: fieldName }) =>
          Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
        abiJSON
      )
      abiDefinitions.serialize(buffer, abiJSON)
      return Buffer.from(buffer.asUint8Array()).toString('hex')
    } catch (err) {
      throw new WrappedError('Failed reading ABI', err)
    }
  }

  isRetryableError (msg) {
    for (const retryable of retryableErrors) {
      if (msg.includes(retryable)) {
        return true
      }
    }
    return false
  }
}

module.exports = EOSApi
