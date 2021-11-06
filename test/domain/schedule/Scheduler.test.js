/* eslint-disable camelcase */
const { SourceType } = require('../../../src/const')
const { LoaderJobFactory } = require('../../../src/domain/job')
const { Scheduler } = require('../../../src/domain/schedule')

jest.setTimeout(20000)

let logApiMock
let cronTabMock
let jobMock
let jobConfigMock
let scheduler

beforeAll(() => {
  logApiMock = {
    d: 'dummy log api, used only for validation',
    start: jest.fn()
  }
  cronTabMock = {
    addJob: jest.fn()
  }
  jobConfigMock = {
    getJobConfigs: jest.fn()
  }
  jobMock = {
    run: jest.fn()
  }
  LoaderJobFactory.getInstance = jest.fn()
  LoaderJobFactory.getInstance.mockReturnValue(jobMock)

  scheduler = new Scheduler({
    logApi: logApiMock,
    jobConfig: jobConfigMock,
    cronTab: cronTabMock
  })
})

beforeEach(() => {
  cronTabMock.addJob.mockClear()
  logApiMock.start.mockClear()
  jobMock.run.mockClear()
  LoaderJobFactory.getInstance.mockClear()
  jobConfigMock.getJobConfigs.mockReset()
})

describe('schedule', () => {
  test('Successful run one job to schedule', async () => {
    const jobConfs = [{
      source_type: SourceType.REST,
      schedule: '* * * * *'
    }]
    jobConfigMock.getJobConfigs.mockResolvedValue(jobConfs)

    await scheduler.schedule()
    expect(logApiMock.start).toHaveBeenCalledTimes(1)
    expect(jobConfigMock.getJobConfigs).toHaveBeenCalledTimes(1)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledTimes(1)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledWith(jobConfs[0].source_type, jobConfs[0], logApiMock)
    expect(cronTabMock.addJob).toHaveBeenCalledTimes(1)
    expect(cronTabMock.addJob.mock.calls[0][0]).toBe(jobConfs[0].schedule)
  })

  test('Successful run multiple jobs to schedule', async () => {
    const jobConfs = [{
      source_type: SourceType.REST,
      schedule: '* * * * *'
    },
    {
      source_type: 'source type 2',
      schedule: '1 * * * *'
    },
    {
      source_type: SourceType.REST,
      schedule: '2 * * * *'
    }]
    jobConfigMock.getJobConfigs.mockResolvedValue(jobConfs)

    await scheduler.schedule()
    expect(logApiMock.start).toHaveBeenCalledTimes(1)
    expect(jobConfigMock.getJobConfigs).toHaveBeenCalledTimes(1)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledTimes(3)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledWith(jobConfs[0].source_type, jobConfs[0], logApiMock)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledWith(jobConfs[1].source_type, jobConfs[1], logApiMock)
    expect(LoaderJobFactory.getInstance).toHaveBeenCalledWith(jobConfs[2].source_type, jobConfs[2], logApiMock)
    expect(cronTabMock.addJob).toHaveBeenCalledTimes(3)
    expect(cronTabMock.addJob.mock.calls[0][0]).toBe(jobConfs[0].schedule)
    expect(cronTabMock.addJob.mock.calls[1][0]).toBe(jobConfs[1].schedule)
    expect(cronTabMock.addJob.mock.calls[2][0]).toBe(jobConfs[2].schedule)
  })

  test('Should fail for no jobs to schedule', async () => {
    expect.assertions(3)
    const jobConfs = []
    jobConfigMock.getJobConfigs.mockResolvedValue(jobConfs)

    try {
      await scheduler.schedule()
    } catch (error) {
      expect(error.cause.message).toBe('No jobs to schedule')
    }
    expect(logApiMock.start).toHaveBeenCalledTimes(0)
    expect(jobConfigMock.getJobConfigs).toHaveBeenCalledTimes(1)
  })

  test('Should fail for error while scheduling jobs', async () => {
    expect.assertions(3)
    const error = new Error('failed fetching jobs')
    jobConfigMock.getJobConfigs.mockRejectedValue(error)

    try {
      await scheduler.schedule()
    } catch (err) {
      expect(err.cause).toBe(error)
    }
    expect(logApiMock.start).toHaveBeenCalledTimes(0)
    expect(jobConfigMock.getJobConfigs).toHaveBeenCalledTimes(1)
  })
})
