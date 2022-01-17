const config = require('config')
const { HashiCorpVault } = require('../../../../src/domain/config/vault')
const { WrappedError } = require('../../../../src/error')
jest.setTimeout(20000)

let vault

beforeAll(async () => {
  vault = new HashiCorpVault(config.get('vault'))
  await vault.init()
})

describe('read method', () => {
  test('Verify succesful read of value from the hashicorp vault', async () => {
    const credentials = await vault.read('secret-v1/data/hppl/cohesity')
    expect(credentials).toEqual({
      username: 'user',
      password: 'password',
      domain: 'LOCAL'
    })
  })

  test('Verify should fail for reading non existant key from the vault ', async () => {
    expect.assertions(2)
    try {
      await vault.read('secret-v1/data/hppl/invalid')
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.message).toContain('failed reading value for key')
    }
  })
})

describe('readAsArray method', () => {
  test('Verify succesful read as array of value from the hashicorp vault', async () => {
    const keys = await vault.readAsArray('secret-v1/data/hppl/contract', 'keys')
    expect(keys).toEqual(['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3', '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD2'])
  })

  test('Verify should fail for reading as array for non existant key from the vault ', async () => {
    expect.assertions(2)
    try {
      await vault.readAsArray('secret-v1/data/hppl/invalid')
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
      expect(err.message).toContain('failed reading value for key')
    }
  })
})
