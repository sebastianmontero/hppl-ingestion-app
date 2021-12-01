const { config } = require('../../src/service')

jest.setTimeout(20000)

describe('get method', () => {
  test('Verify succesful get method operation', async () => {
    expect(config.get('contract.names.jobConfig')).toBe('hppljobsconf')
  })

  test('Verify get should fail for invalid key', async () => {
    expect.assertions(1)
    try {
      config.get('nonExistant')
    } catch (error) {
      expect(error.message).toContain('property "nonExistant" is not defined')
    }
  })
})

describe('has method', () => {
  test('Verify succesful has method operation', async () => {
    expect(config.has('contract.names.jobConfig')).toBe(true)
    expect(config.has('nonExistant')).toBe(false)
  })
})

describe('getOr method', () => {
  test('Verify succesful getOr method operation', async () => {
    expect(config.getOr('contract.names.jobConfig')).toBe('hppljobsconf')
    expect(config.getOr('nonExistant', 'default')).toBe('default')
  })
})
