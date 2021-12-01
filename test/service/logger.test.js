const { logger } = require('../../src/service')
const { WrappedError } = require('../../src/error')

jest.setTimeout(20000)

describe('logging methods', () => {
  test('Verify logging level methods operation', async () => {
    const error = new Error('This is an error')
    const wrappedError = new WrappedError('This is a wrapped error', error)
    logger.info('Info message only')
    logger.info('Info message with metadata', { prop1: 'value1', prop2: 'value2' })
    logger.error('String error in metadata', { error: 'This is a string error', prop2: 'value2' })
    logger.error('Error in metadata', { error, prop2: 'value2' })
    logger.error('Wrapped Error in metadata', { error: wrappedError, prop2: 'value2' })
    logger.error('Detailed String error in metadata', { errord: 'This is a string error', prop2: 'value2' })
    logger.error('Detailed Error in metadata', { errord: error, prop2: 'value2' })
    logger.error('Detailed Wrapped Error in metadata', { errord: wrappedError, prop2: 'value2' })
  })
})
