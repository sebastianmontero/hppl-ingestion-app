const config = require('config')
const { HashiCorpVault } = require('../../../../src/domain/config/vault')
jest.setTimeout(20000)

let vault

beforeAll(async () => {
  vault = new HashiCorpVault(config.get('vault'))
})

describe('Integration test', () => {
  test('Test can read values from running hashicorp vault', async () => {
    await vault.init()
    const credentials = await vault.read('secret-v1/data/hppl/cohesity')
    expect(credentials).toEqual({
      user: 'user',
      password: 'password',
      domain: 'LOCAL'
    })
    const keys = await vault.readAsArray('secret-v1/data/hppl/contract', 'keys')
    expect(keys).toEqual(['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3', '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD2'])
  })
})
