const sleep = require('await-sleep')
const { InternalError } = require('../../src/error')
const { BufferedLogApi } = require('../../src/service')

jest.setTimeout(20000)

let bufferedLogApi
let logApiMock
let queueMock
let queuePopTrxMock

beforeAll(async () => {
  logApiMock = {
    log: jest.fn()
  }

  queueMock = {
    length: jest.fn(),
    trxPop: jest.fn(),
    push: jest.fn(),
    init: jest.fn()
  }

  queuePopTrxMock = {
    getObj: jest.fn(),
    commit: jest.fn(),
    rollback: jest.fn()
  }

  queueMock.trxPop.mockResolvedValue(queuePopTrxMock)
})

beforeEach(async () => {
  bufferedLogApi = new BufferedLogApi({
    logApi: logApiMock,
    queue: queueMock,
    intervalSeconds: 1
  })
  logApiMock.log.mockClear()
  queueMock.init.mockClear()
  queueMock.length.mockClear()
  queueMock.trxPop.mockClear()
  queuePopTrxMock.getObj.mockClear()
  queuePopTrxMock.commit.mockClear()
  queuePopTrxMock.rollback.mockClear()
})

describe('Start and stop methods', () => {
  test('Verify start method is only processed when queue is in stopped state', async () => {
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    expect(bufferedLogApi.stopped).toBe(true)
    await bufferedLogApi.start()
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(1)
    expect(queueMock.init).toBeCalledTimes(1)
    expect(bufferedLogApi.stopped).toBe(false)
    await bufferedLogApi.start()
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(1)
    expect(queueMock.init).toBeCalledTimes(1)
    expect(bufferedLogApi.stopped).toBe(false)
    bufferedLogApi.stop()
    expect(bufferedLogApi.stopped).toBe(true)
    await bufferedLogApi.start()
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(2)
    expect(queueMock.init).toBeCalledTimes(2)
    expect(bufferedLogApi.stopped).toBe(false)
  })
  test('Verify is correctly stopped', async () => {
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    expect(bufferedLogApi.stopped).toBe(true)
    await bufferedLogApi.start()
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(1)
    expect(queueMock.init).toBeCalledTimes(1)
    expect(bufferedLogApi.stopped).toBe(false)
    bufferedLogApi.stop()
    expect(bufferedLogApi.stopped).toBe(true)
  })
})
describe('_processBuffer method', () => {
  test('Verify empty buffer is processed correctly', async () => {
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    await bufferedLogApi.start()
    queueMock.length.mockResolvedValueOnce(0)
    await bufferedLogApi._processBuffer()
    expect(queueMock.length).toBeCalledTimes(1)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(2)
    expect(queueMock.trxPop).toBeCalledTimes(0)
    expect(logApiMock.log).toBeCalledTimes(0)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(0)
    expect(queuePopTrxMock.commit).toBeCalledTimes(0)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
  })

  test('Verify buffer with only one item is processed correctly', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    await bufferedLogApi.start()
    queueMock.length.mockResolvedValueOnce(1)
    queueMock.length.mockResolvedValueOnce(0)
    queuePopTrxMock.getObj.mockReturnValueOnce(obj1)

    await bufferedLogApi._processBuffer()
    expect(queueMock.length).toBeCalledTimes(2)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(2)
    expect(queueMock.trxPop).toBeCalledTimes(1)
    expect(logApiMock.log).toBeCalledTimes(1)
    expect(logApiMock.log).toHaveBeenNthCalledWith(1, obj1)
    expect(queuePopTrxMock.commit).toBeCalledTimes(1)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
  })

  test('Verify buffer with multiple items in a single cycle is processed correctly', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    const obj2 = {
      prop2: 'value2'
    }
    const obj3 = {
      prop3: 'value3'
    }
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    await bufferedLogApi.start()
    queueMock.length.mockResolvedValueOnce(3)
    queueMock.length.mockResolvedValueOnce(0)
    queuePopTrxMock.getObj
      .mockReturnValueOnce(obj1)
      .mockReturnValueOnce(obj2)
      .mockReturnValueOnce(obj3)

    await bufferedLogApi._processBuffer()
    expect(queueMock.length).toBeCalledTimes(2)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(2)
    expect(queueMock.trxPop).toBeCalledTimes(3)
    expect(logApiMock.log).toBeCalledTimes(3)
    expect(logApiMock.log).toHaveBeenNthCalledWith(1, obj1)
    expect(logApiMock.log).toHaveBeenNthCalledWith(2, obj2)
    expect(logApiMock.log).toHaveBeenNthCalledWith(3, obj3)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(3)
    expect(queuePopTrxMock.commit).toBeCalledTimes(3)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
  })

  test('Verify external error when logging causes processing to stop until next cycle', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    const obj2 = {
      prop2: 'value2'
    }
    const error = new Error('error while logging')
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    await bufferedLogApi.start()
    queueMock.length.mockResolvedValueOnce(3)
    queuePopTrxMock.getObj
      .mockReturnValueOnce(obj1)
      .mockReturnValueOnce(obj2)
    logApiMock.log
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(error)

    await bufferedLogApi._processBuffer()
    expect(queueMock.length).toBeCalledTimes(1)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(2)
    expect(queueMock.trxPop).toBeCalledTimes(2)
    expect(logApiMock.log).toBeCalledTimes(2)
    expect(logApiMock.log).toHaveBeenNthCalledWith(1, obj1)
    expect(logApiMock.log).toHaveBeenNthCalledWith(2, obj2)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(2)
    expect(queuePopTrxMock.commit).toBeCalledTimes(1)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(1)
  })

  test('Verify internal error when logging causes to throw exception', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    const error = new InternalError('commit failed')
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    await bufferedLogApi.start()
    queueMock.length.mockResolvedValueOnce(3)
    queuePopTrxMock.getObj
      .mockReturnValueOnce(obj1)
    queuePopTrxMock.commit
      .mockRejectedValueOnce(error)

    expect.assertions(11)
    try {
      await bufferedLogApi._processBuffer()
    } catch (err) {
      expect(err).toBeInstanceOf(InternalError)
      expect(err.cause).toBeInstanceOf(InternalError)
      expect(err.cause).toEqual(error)
    }
    expect(queueMock.length).toBeCalledTimes(1)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(1)
    expect(queueMock.trxPop).toBeCalledTimes(1)
    expect(logApiMock.log).toBeCalledTimes(1)
    expect(logApiMock.log).toHaveBeenNthCalledWith(1, obj1)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(1)
    expect(queuePopTrxMock.commit).toBeCalledTimes(1)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
  })

  test('Verify that calling stop, stops buffer processing', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    bufferedLogApi._scheduleBufferProcessing = jest.fn()
    queueMock.length.mockResolvedValueOnce(3)
    queuePopTrxMock.getObj
      .mockReturnValue(obj1)

    bufferedLogApi.stop()
    await bufferedLogApi._processBuffer()
    expect(queueMock.length).toBeCalledTimes(1)
    expect(bufferedLogApi._scheduleBufferProcessing).toBeCalledTimes(0)
    expect(queueMock.trxPop).toBeCalledTimes(0)
    expect(logApiMock.log).toBeCalledTimes(0)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(0)
    expect(queuePopTrxMock.commit).toBeCalledTimes(0)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
  })
})

describe('_scheduleBufferProcessing method', () => {
  test('Verify buffer processing is scheduled and stopped correctly', async () => {
    const obj1 = {
      prop1: 'value1'
    }
    const obj2 = {
      prop2: 'value2'
    }
    const obj3 = {
      prop3: 'value3'
    }
    const error = new Error('failed logging')
    queueMock.length
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3)
    queuePopTrxMock.getObj
      .mockReturnValueOnce(obj1)
      .mockReturnValueOnce(obj2)
      .mockReturnValueOnce(obj3)
    logApiMock.log
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce()
    bufferedLogApi.start()
    expect(queueMock.length).toBeCalledTimes(0)
    expect(queueMock.trxPop).toBeCalledTimes(0)
    expect(logApiMock.log).toBeCalledTimes(0)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(0)
    expect(queuePopTrxMock.commit).toBeCalledTimes(0)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(0)
    await sleep(1001)
    expect(queueMock.length).toBeCalledTimes(1)
    expect(queueMock.trxPop).toBeCalledTimes(2)
    expect(logApiMock.log).toBeCalledTimes(2)
    expect(logApiMock.log).toHaveBeenNthCalledWith(1, obj1)
    expect(logApiMock.log).toHaveBeenNthCalledWith(2, obj2)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(2)
    expect(queuePopTrxMock.commit).toBeCalledTimes(1)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(1)
    await sleep(1001)
    expect(queueMock.length).toBeCalledTimes(2)
    expect(queueMock.trxPop).toBeCalledTimes(2)
    expect(logApiMock.log).toBeCalledTimes(2)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(2)
    expect(queuePopTrxMock.commit).toBeCalledTimes(1)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(1)
    await sleep(1001)
    expect(queueMock.length).toBeCalledTimes(4)
    expect(queueMock.trxPop).toBeCalledTimes(3)
    expect(logApiMock.log).toBeCalledTimes(3)
    expect(logApiMock.log).toHaveBeenNthCalledWith(3, obj3)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(3)
    expect(queuePopTrxMock.commit).toBeCalledTimes(2)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(1)
    bufferedLogApi.stop()
    await sleep(1001)
    expect(queueMock.length).toBeCalledTimes(4)
    expect(queueMock.trxPop).toBeCalledTimes(3)
    expect(logApiMock.log).toBeCalledTimes(3)
    expect(logApiMock.log).toHaveBeenNthCalledWith(3, obj3)
    expect(queuePopTrxMock.getObj).toBeCalledTimes(3)
    expect(queuePopTrxMock.commit).toBeCalledTimes(2)
    expect(queuePopTrxMock.rollback).toBeCalledTimes(1)
  })
})
