class Vault {
  async read (key) {
    return {
      user: 'user',
      password: 'password'
    }
  }
}
module.exports = Vault
