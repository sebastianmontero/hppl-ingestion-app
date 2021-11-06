/* eslint-disable camelcase */
const { ContentType, SourceSystemType } = require('../../../src/const')
const { ExternalError, InternalError } = require('../../../src/error')
const { LoaderJob } = require('../../../src/domain/job')
const { ParserFactory, JSONParser } = require('../../../src/domain/parser')

jest.setTimeout(20000)

describe('run', () => {
  test('Successful run', async () => {
    const payload = {
      generic: {
        field1: 'generic1'
      },
      extraField: 'extraField1'
    }
    const logApi = {
      log: jest.fn()
    }
    const fetch_timestamp = new Date().toISOString()
    const source_system_type = SourceSystemType.COHESITY
    const source_system_id = 'cluster1'
    const endpoint_id = 'endpoint1'
    const job = new LoaderJob({
      content_type: ContentType.JSON,
      source_system_type,
      source_system_id,
      endpoint_id,
      index_fields: [
        'generic.field1',
        'genericField2'
      ]
    }, logApi)

    job._fetchPayload = jest.fn()
    job._fetchPayload.mockResolvedValueOnce(payload)
    job._getTimestamp = jest.fn()
    job._getTimestamp.mockReturnValueOnce(fetch_timestamp)

    const parser = new JSONParser()
    parser.parse = jest.fn()
    parser.parse.mockReturnValueOnce(payload)

    ParserFactory.getInstance = jest.fn()
    ParserFactory.getInstance.mockReturnValueOnce(parser)

    await job.run()
    expect(ParserFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(ParserFactory.getInstance).toHaveBeenCalledWith(ContentType.JSON)
    expect(parser.parse).toHaveBeenCalledTimes(1)
    expect(parser.parse).toHaveBeenCalledWith(payload)
    expect(logApi.log).toHaveBeenCalledTimes(1)
    expect(logApi.log).toHaveBeenCalledWith({
      source_system_type,
      source_system_id,
      endpoint_id,
      generic_field_1: 'generic1',
      generic_field_2: '',
      generic_field_3: '',
      fetch_timestamp,
      payload: JSON.stringify(payload)
    })
  })

  test('Internal  error should be thrown', async () => {
    expect.assertions(3)
    const logApi = {
      log: jest.fn()
    }
    const source_system_type = SourceSystemType.COHESITY
    const source_system_id = 'cluster1'
    const endpoint_id = 'endpoint1'
    const job = new LoaderJob({
      content_type: ContentType.JSON,
      source_system_type,
      source_system_id,
      endpoint_id,
      index_fields: [
        'genericField1',
        'genericField2'
      ]
    }, logApi)

    job._fetchPayload = jest.fn()
    job._fetchPayload.mockRejectedValueOnce(new InternalError('failed'))

    ParserFactory.getInstance = jest.fn()
    try {
      await job.run()
    } catch (err) {
      expect(err).toBeInstanceOf(InternalError)
    }
    expect(ParserFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(logApi.log).toHaveBeenCalledTimes(0)
  })

  test('External  error should be logged only', async () => {
    const logApi = {
      log: jest.fn()
    }
    const source_system_type = SourceSystemType.COHESITY
    const source_system_id = 'cluster1'
    const endpoint_id = 'endpoint1'
    const job = new LoaderJob({
      content_type: ContentType.JSON,
      source_system_type,
      source_system_id,
      endpoint_id,
      index_fields: [
        'genericField1',
        'genericField2'
      ]
    }, logApi)

    job._fetchPayload = jest.fn()
    job._fetchPayload.mockRejectedValueOnce(new ExternalError('failed'))

    ParserFactory.getInstance = jest.fn()

    await job.run()
    expect(ParserFactory.getInstance).toHaveBeenCalledTimes(0)
    expect(logApi.log).toHaveBeenCalledTimes(0)
  })
})
