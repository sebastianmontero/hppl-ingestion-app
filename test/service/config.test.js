const { config } = require('../../src/service')

jest.setTimeout(20000)

describe('Test config class', () => {
  test('Test get', async () => {
    expect.assertions(2)
    expect(config.get('contract.names.jobConfig')).toBe('hppljobsconf')
    try {
      config.get('nonExistant')
    } catch (error) {
      expect(error.message).toContain('property "nonExistant" is not defined')
    }
  })

  test('Test has', async () => {
    expect(config.has('contract.names.jobConfig')).toBe(true)
    expect(config.has('nonExistant')).toBe(false)
  })

  test('Test getOr', async () => {
    expect(config.getOr('contract.names.jobConfig')).toBe('hppljobsconf')
    expect(config.getOr('nonExistant', 'default')).toBe('default')
  })
})
