/* eslint-disable no-undef */
const { JobsConfigApi } = require('../../src/service')
const { contractNames, testSetupHelper } = require('../TestSetupHelper')

jest.setTimeout(20000)

let jobsConfigApi

beforeAll(async () => {
  await testSetupHelper.setupNodeos()
  jobsConfigApi = await new JobsConfigApi({
    contract: contractNames.jobsconfig,
    eosApi: testSetupHelper.eosApi
  })
})

beforeEach(async () => {
  await jobsConfigApi.reset(contractNames.jobsconfig)
})

describe('Add, Update, Delete Job', () => {
  test('Add, Update, Delete Job', async () => {
    let job1 = {
      job_name: 'job1',
      job_description: 'job1 desc',
      source_type: 'REST',
      source_system_type: 'Cohesity',
      source_system_id: 'cluster1',
      endpoint_id: 'endpoint1',
      schedule: '0 * * * *',
      index_fields: ['index1', 'index2'],
      job_specific_config: `{
        "url":"url"
      }`
    }
    await jobsConfigApi.upsert(job1, contractNames.jobsconfig)
    let jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [job1])

    let job2 = {
      job_name: 'job2',
      job_description: 'job2 desc',
      source_type: 'REST',
      source_system_type: 'Cohesity',
      source_system_id: 'cluster2',
      endpoint_id: 'endpoint2',
      schedule: '0 * * * *',
      index_fields: [],
      job_specific_config: `{
        "url":"url",
      }`
    }
    await jobsConfigApi.upsert(job2)
    jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [job1, job2])
    const job = await jobsConfigApi.getLast()
    expect(job).not.toBeNull()
    assertJob(job, job2)

    job1 = {
      job_id: jobs[0].job_id,
      job_name: 'job1 updated',
      job_description: 'job1 desc updated',
      source_type: 'REST updated',
      source_system_type: 'Cohesity updated',
      source_system_id: 'cluster1 updated',
      endpoint_id: 'endpoint1 updated',
      schedule: '1 * * * *',
      index_fields: ['index1 updated', 'index2 updated'],
      job_specific_config: `{
        "url":"url updated",
      }`
    }

    await jobsConfigApi.upsert(job1, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [job1, job2])

    job2 = {
      job_id: jobs[1].job_id,
      job_name: 'job2 updated',
      job_description: 'job2 desc updated',
      source_type: 'REST updated',
      source_system_type: 'Cohesity updated',
      source_system_id: 'cluster2 updated',
      endpoint_id: 'endpoint2 updated',
      schedule: '2 * * * *',
      index_fields: ['index1 updated', 'index2 updated'],
      job_specific_config: `{
        "url":"url updated",
      }`
    }

    await jobsConfigApi.upsert(job2, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [job1, job2])

    await jobsConfigApi.delete(job1.job_id, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [job2])

    await jobsConfigApi.delete(job2.job_id, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobs(jobs, [])
  })
})

function assertJobs (actual, expected) {
  expect(actual).not.toBeNull()
  expect(actual).toBeInstanceOf(Array)
  expect(actual).toHaveLength(expected.length)
  for (const [i, e] of expected.entries()) {
    assertJob(actual[i], e)
  }
}

function assertJob (actual, expected) {
  expect(actual.job_name).toBe(expected.job_name)
  expect(actual.job_description).toBe(expected.job_description)
  expect(actual.source_type).toBe(expected.source_type)
  expect(actual.source_system_type).toBe(expected.source_system_type)
  expect(actual.source_system_id).toBe(expected.source_system_id)
  expect(actual.endpoint_id).toBe(expected.endpoint_id)
  expect(actual.schedule).toBe(expected.schedule)
  expect(actual.index_fields).toEqual(expected.index_fields)
  expect(actual.job_specific_config).toBe(expected.job_specific_config)
}
