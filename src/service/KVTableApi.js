const ContractApi = require('./ContractApi')

class KVTableApi extends ContractApi {
  constructor ({
    contract,
    eosApi
  }) {
    super({
      contract,
      eosApi
    })
    // KV Table must have the same name as contract
    this.table = contract
  }

  async getTableRows ({
    json = true,
    indexName,
    lowerBound,
    upperBound,
    limit,
    reverse = false,
    showPayer = false
  }) {
    return this.eosApi.getKVTableRows({
      json,
      code: this.contract,
      table: this.table,
      indexName,
      lowerBound,
      upperBound,
      limit,
      reverse,
      showPayer
    })
  }

  async getSingleTableRow ({
    json = true,
    indexName,
    lowerBound,
    upperBound,
    reverse,
    showPayer = false

  }) {
    return this.eosApi.getSingleKVTableRow({
      json,
      code: this.contract,
      table: this.table,
      indexName,
      lowerBound,
      upperBound,
      reverse,
      showPayer
    })
  }

  async getAllTableRows ({
    json = true,
    indexName,
    lowerBound,
    upperBound,
    showPayer = false
  }) {
    return this.eosApi.getAllKVTableRows({
      json,
      code: this.contract,
      table: this.table,
      indexName,
      lowerBound,
      upperBound,
      showPayer
    })
  }
}

module.exports = KVTableApi
