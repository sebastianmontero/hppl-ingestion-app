/* eslint-disable no-undef */
const { contractNames, testSetupHelper } = require('../TestSetupHelper')

jest.setTimeout(20000)

let logApi

beforeAll(async () => {
  await testSetupHelper.setupNodeos()
  logApi = testSetupHelper.logApi
})

beforeEach(async () => {
  await logApi.reset(contractNames.logger)
})

describe('log, getAll and getLast method', () => {
  test('Verify succesful logging and log querying operation', async () => {
    const log1 = {
      source_system_type: 'Cohesity',
      source_system_id: 'cluster1',
      endpoint_id: 'endpoint1',
      generic_field_1: 'field_1_value1',
      generic_field_2: 'field_2_value1',
      generic_field_3: 'field_3_value1',
      fetch_timestamp: new Date('2021-10-30T01:36:41'),
      payload: `{
        "data": "data1"
      }`
    }
    await logApi.log(log1)
    let logs = await logApi.getAll()
    assertLogs(logs, [log1])

    const log2 = {
      source_system_type: 'Cohesity',
      source_system_id: 'cluster2',
      endpoint_id: 'endpoint2',
      generic_field_1: 'field_1_value2',
      generic_field_2: 'field_2_value2',
      generic_field_3: 'field_3_value2',
      fetch_timestamp: new Date('2021-10-30T02:36:41'),
      payload: `{
        "data": "data2"
      }`
    }
    await logApi.log(log2, contractNames.logger)
    logs = await logApi.getAll()
    assertLogs(logs, [log1, log2])

    const log = await logApi.getLast()
    assertLog(log, log2)
  })
})

function assertLogs (actual, expected) {
  expect(actual).not.toBeNull()
  expect(actual).toBeInstanceOf(Array)
  expect(actual).toHaveLength(expected.length)
  for (const [i, e] of expected.entries()) {
    assertLog(actual[i], e)
  }
}

function assertLog (actual, expected) {
  expect(actual.source_system_type).toBe(expected.source_system_type)
  expect(actual.source_system_id).toBe(expected.source_system_id)
  expect(actual.endpoint_id).toBe(expected.endpoint_id)
  expect(actual.generic_field_1).toBe(expected.generic_field_1)
  expect(actual.generic_field_2).toBe(expected.generic_field_2)
  expect(actual.generic_field_3).toBe(expected.generic_field_3)
  expect(new Date(actual.fetch_timestamp)).toEqual(expected.fetch_timestamp)
  expect(actual.payload).toEqual(expected.payload)
}
