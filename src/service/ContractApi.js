
class ContractApi {
  constructor ({
    contract,
    eosApi,
    defaultAuthorization = null
  }) {
    this.contract = contract
    this.eosApi = eosApi
    this.defaultAuthorization = defaultAuthorization || this.contract
  }

  async trx (actions, retries = 5) {
    return this.eosApi.trx(actions, this.defaultAuthorization, retries)
  }

  async simpleTrx ({
    name,
    data,
    authorization
  }, retries = 5) {
    authorization = authorization || this.defaultAuthorization
    return this.eosApi.simpleTrx(
      {
        account: this.contract,
        name,
        data,
        authorization
      }
      , retries)
  }
}

module.exports = ContractApi
