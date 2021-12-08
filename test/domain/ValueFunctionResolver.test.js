const { ValueFunctionResolver } = require('../../src/domain')
const { InternalError } = require('../../src/error')

jest.setTimeout(20000)

beforeAll(async () => {
  ValueFunctionResolver.getDate = function () {
    return new Date(1638974845786)
  }
})

describe('resolve method', () => {
  test('Verify successful value function resolution', async () => {
    const nonResolvedProps = {
      number: 12,
      str: 'Hola',
      empty: '',
      array: [1, 2, 3],
      parcialPattern1: '#{adasd',
      parcialPattern2: 'ada}#'
    }

    const obj = {
      ...nonResolvedProps,
      negativeOffset: '#{unixEpochOffset,-7}#',
      positiveOffset: '#{unixEpochOffset,50}#',
      nestedObj: {
        negativeOffset: '#{unixEpochOffset,-100}#'
      }
    }
    const resolvedObj = ValueFunctionResolver.resolve(obj)

    expect(resolvedObj).toEqual({
      ...nonResolvedProps,
      negativeOffset: 1638974425786000,
      positiveOffset: 1638977845786000,
      nestedObj: {
        negativeOffset: 1638968845786000
      }
    })
  })
  test('Verify value function resolution throws internal error for no existant function', async () => {
    expect.assertions(2)
    const obj = {
      val: '123',
      nonExistant: '#{nonExistant,2}#'
    }
    try {
      ValueFunctionResolver.resolve(obj)
    } catch (error) {
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toContain('Value function with name: nonExistant does not exist')
    }
  })
  test('Verify unixEpochOffset value function throws internal error for no parameter', async () => {
    expect.assertions(2)
    const obj = {
      val: '123',
      nonExistant: '#{unixEpochOffset}#'
    }
    try {
      ValueFunctionResolver.resolve(obj)
    } catch (error) {
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toContain('Offset parameter of unixEpochOffset must be an integer, provided: undefined')
    }
  })
  test('Verify unixEpochOffset value function throws internal error for invalid parameter', async () => {
    expect.assertions(2)
    const obj = {
      val: '123',
      nonExistant: '#{unixEpochOffset,asdas}#'
    }
    try {
      ValueFunctionResolver.resolve(obj)
    } catch (error) {
      expect(error).toBeInstanceOf(InternalError)
      expect(error.message).toContain('Offset parameter of unixEpochOffset must be an integer, provided: asdas')
    }
  })
})
