const sleep = require('await-sleep')
const yargs = require('yargs')
const { ContractsCommand } = require('../../src/command')

jest.setTimeout(20000)

let configMock
let eosApiMock

beforeAll(async () => {
  configMock = {
    get: jest.fn()
  }
  eosApiMock = {
    deployContract: jest.fn()
  }
  configMock.get.mockReturnValue({
    jobConfig: 'hppljobsconf',
    logger: 'hpplapiloggr'
  })
})

beforeEach(async () => {
  configMock.get.mockClear()
  eosApiMock.deployContract.mockClear()
})

describe('deploy command', () => {
  test('Verify successful deploy command operation', async () => {
    const dir = '/contracts'
    runCommand(['contracts', 'deploy', dir])
    await sleep(1) // So that async functions are called, as there is no way to await
    expect(configMock.get).toBeCalledTimes(1)
    expect(configMock.get).toBeCalledWith('contract.names')
    expect(eosApiMock.deployContract).toBeCalledTimes(2)
    expect(eosApiMock.deployContract).toHaveBeenNthCalledWith(1, 'hppljobsconf', `${dir}/jobsconfig.wasm`, `${dir}/jobsconfig.abi`)
    expect(eosApiMock.deployContract).toHaveBeenNthCalledWith(2, 'hpplapiloggr', `${dir}/logger.wasm`, `${dir}/logger.abi`)
  })
})

function runCommand (args, failfn) {
  failfn = failfn || false
  const contractsCommand = new ContractsCommand({
    eosApi: eosApiMock,
    config: configMock
  })
  // eslint-disable-next-line no-unused-vars
  const _argv = yargs(args)
    .strict()
    .usage('usage: $0 <command>')
    .command('contracts', 'Deploy contracts', function (yargs) {
      contractsCommand.buildCommand(yargs)
    })
    .fail(failfn)
    .argv

  return contractsCommand
}
