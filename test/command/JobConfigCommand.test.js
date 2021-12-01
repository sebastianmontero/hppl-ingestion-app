const sleep = require('await-sleep')
const yargs = require('yargs')
const { JobConfigCommand } = require('../../src/command')

jest.setTimeout(20000)

let jobConfigMock

beforeAll(async () => {
  jobConfigMock = {
    loadJobConfigsFromFile: jest.fn(),
    jobConfigApi: {
      getAll: jest.fn(),
      delete: jest.fn(),
      reset: jest.fn()
    }

  }
  jobConfigMock.jobConfigApi.getAll.mockResolvedValue([])
})

beforeEach(async () => {
  jobConfigMock.loadJobConfigsFromFile.mockClear()
  jobConfigMock.jobConfigApi.getAll.mockClear()
  jobConfigMock.jobConfigApi.delete.mockClear()
  jobConfigMock.jobConfigApi.reset.mockClear()
})

describe('load command', () => {
  test('Verify successful load command operation without reset flag', async () => {
    const file = 'file.json'
    runCommand(['job-config', 'load', 'file.json'])
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledTimes(1)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledWith(file, false)
  })

  test('Verify successful load command operation with reset flag', async () => {
    const file = 'file.json'
    runCommand(['job-config', 'load', 'file.json', '-r'])
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledTimes(1)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledWith(file, true)
  })
})

describe('list command', () => {
  test('Verify successful list command operation', async () => {
    runCommand(['job-config', 'list'])
    expect(jobConfigMock.jobConfigApi.getAll).toBeCalledTimes(1)
  })
})

describe('delete command', () => {
  test('Verify successful delete command operation with ids option', async () => {
    runCommand(['job-config', 'delete', '--ids', '1', '2'])
    await sleep(1) // So that async functions are called, as there is no way to await
    expect(jobConfigMock.jobConfigApi.delete).toBeCalledTimes(2)
    expect(jobConfigMock.jobConfigApi.delete).toHaveBeenNthCalledWith(1, 1)
    expect(jobConfigMock.jobConfigApi.delete).toHaveBeenNthCalledWith(2, 2)
  })
  test('Verify delete command should fail for invalid ids', async () => {
    expect.assertions(1)
    try {
      const jobConfigCommand = new JobConfigCommand(jobConfigMock)
      await jobConfigCommand.delete({
        ids: ['a', '2']
      })
    } catch (err) {
      expect(err.message).toContain('Please enter valid uint64 numbers')
    }
  })
  test('Verify successful delete command operation with all option', async () => {
    runCommand(['job-config', 'delete', '--all'])
    expect(jobConfigMock.jobConfigApi.reset).toBeCalledTimes(1)
  })
})

function runCommand (args, failfn) {
  failfn = failfn || false
  const jobConfigCommand = new JobConfigCommand(jobConfigMock)
  // eslint-disable-next-line no-unused-vars
  const _argv = yargs(args)
    .strict()
    .usage('usage: $0 <command>')
    .command('job-config', 'Load, reload, list and delete job configs', function (yargs) {
      jobConfigCommand.buildCommand(yargs)
    })
    .fail(failfn)
    .argv

  return jobConfigCommand
}
