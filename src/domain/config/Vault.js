const { VaultKey } = require('../../const')

class Vault {
  async read (key) {
    if (key === VaultKey.CONTRACT_KEYS) {
      return {
        keys: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']
      }
    } else if (key === 'secretParam') {
      return 'secretParamValue'
    } else if (key === 'secretData') {
      return 'secretDataValue'
    } else {
      return {
        user: 'user',
        password: 'password'
      }
    }
  }
}
module.exports = Vault
