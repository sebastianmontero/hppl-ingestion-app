const sleep = require('await-sleep')
const yargs = require('yargs')
const { IngestionCommand } = require('../../src/command')

jest.setTimeout(20000)

let configMock
let schedulerMock
let jobConfigMock

beforeAll(async () => {
  jobConfigMock = {
    loadJobConfigsFromFile: jest.fn()
  }
  configMock = {
    has: jest.fn(),
    get: jest.fn()
  }
  schedulerMock = {
    schedule: jest.fn()
  }
})

beforeEach(async () => {
  jobConfigMock.loadJobConfigsFromFile.mockClear()
  configMock.has.mockClear()
  configMock.get.mockClear()
  schedulerMock.schedule.mockClear()
})

describe('run command', () => {
  test('Verify successful run command operation without jobConfig file', async () => {
    configMock.has.mockReturnValue(false)
    runCommand(['ingestion', 'run'])
    expect(configMock.has).toBeCalledTimes(1)
    expect(configMock.has).toBeCalledWith('jobConfig.file')
    expect(schedulerMock.schedule).toBeCalledTimes(1)
  })
  test('Verify successful run command operation with jobConfig file command option', async () => {
    const file = 'file.json'
    runCommand(['ingestion', 'run', '-j', file])
    await sleep(1) // So that async functions are called, as there is no way to await
    expect(configMock.has).toBeCalledTimes(0)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledTimes(1)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledWith(file, true)
    expect(schedulerMock.schedule).toBeCalledTimes(1)
  })
  test('Verify successful run command operation with jobConfig file from config file parameter', async () => {
    const file = 'file.json'
    configMock.has.mockReturnValue(true)
    configMock.get.mockReturnValue(file)
    runCommand(['ingestion', 'run'])
    await sleep(1) // So that async functions are called, as there is no way to await
    expect(configMock.has).toBeCalledTimes(1)
    expect(configMock.get).toBeCalledTimes(1)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledTimes(1)
    expect(jobConfigMock.loadJobConfigsFromFile).toBeCalledWith(file, true)
    expect(schedulerMock.schedule).toBeCalledTimes(1)
  })
})

function runCommand (args, failfn) {
  failfn = failfn || false
  const ingestionCommand = new IngestionCommand({
    config: configMock,
    scheduler: schedulerMock,
    jobConfig: jobConfigMock
  })
  // eslint-disable-next-line no-unused-vars
  const _argv = yargs(args)
    .strict()
    .usage('usage: $0 <command>')
    .command('ingestion', 'Manage ingestion process', function (yargs) {
      ingestionCommand.buildCommand(yargs)
    })
    .fail(failfn)
    .argv

  return ingestionCommand
}
