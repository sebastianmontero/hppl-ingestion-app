/* eslint-disable no-undef */
const { contractNames, testSetupHelper } = require('../TestSetupHelper')
const { assertJobConfigs, assertJobConfig } = require('../TestAssertionFunctions')

jest.setTimeout(20000)

let jobsConfigApi

beforeAll(async () => {
  await testSetupHelper.setupNodeos()
  jobsConfigApi = testSetupHelper.jobConfigApi
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
      content_type: 'JSON',
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
    assertJobConfigs(jobs, [job1])

    let job2 = {
      job_name: 'job2',
      job_description: 'job2 desc',
      source_type: 'REST',
      content_type: 'JSON',
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
    assertJobConfigs(jobs, [job1, job2])
    const job = await jobsConfigApi.getLast()
    expect(job).not.toBeNull()
    assertJobConfig(job, job2)

    job1 = {
      job_id: jobs[0].job_id,
      job_name: 'job1 updated',
      job_description: 'job1 desc updated',
      source_type: 'REST updated',
      content_type: 'JSON updated',
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
    assertJobConfigs(jobs, [job1, job2])

    job2 = {
      job_id: jobs[1].job_id,
      job_name: 'job2 updated',
      job_description: 'job2 desc updated',
      source_type: 'REST updated',
      content_type: 'JSON updated',
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
    assertJobConfigs(jobs, [job1, job2])

    await jobsConfigApi.delete(job1.job_id, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobConfigs(jobs, [job2])

    await jobsConfigApi.delete(job2.job_id, contractNames.jobsconfig)
    jobs = await jobsConfigApi.getAll()
    assertJobConfigs(jobs, [])
  })
})
