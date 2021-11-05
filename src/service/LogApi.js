/* eslint-disable camelcase */
const KVTableApi = require('./KVTableApi')

class LogApi extends KVTableApi {
  constructor ({
    contract,
    eosApi
  }) {
    super({
      contract,
      eosApi
    })
  }

  async reset (authorization) {
    return this.simpleTrx({
      name: 'resetlog',
      data: {},
      authorization
    })
  }

  async log ({
    source_system_type,
    source_system_id,
    endpoint_id,
    generic_field_1,
    generic_field_2,
    generic_field_3,
    fetch_timestamp,
    payload
  },
  authorization) {
    return this.simpleTrx({
      name: 'log',
      data: {
        source_system_type,
        source_system_id,
        endpoint_id,
        generic_field_1,
        generic_field_2,
        generic_field_3,
        fetch_timestamp,
        payload
      },
      authorization
    })
  }

  async getAll () {
    return this.getAllTableRows({
      indexName: 'logid'
    })
  }

  async getLast () {
    return this.getSingleTableRow({
      indexName: 'logid',
      reverse: true
    })
  }
}

module.exports = LogApi
