/* eslint-disable no-undef */
const { Config } = require('../../../src/domain/config')
const { VaultKey } = require('../../../src/const')
const { testSetupHelper } = require('../../TestSetupHelper')
const { getJobConfig } = require('../../TestDataFunctions')
const { assertProcessedJobConfigs } = require('../../TestAssertionFunctions')

jest.setTimeout(20000)

let config

const mockVault = {
  async read (key) {
    if (key === VaultKey.CONTRACT_KEYS) {
      return {
        keys: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']
      }
    } else if (key === 'secretParam') {
      return 'secretParamValue'
    } else {
      return {
        user: 'user',
        password: 'password'
      }
    }
  }
}

beforeAll(async () => {
  await testSetupHelper.setupNodeos()
  config = new Config(mockVault)
  await config.init()
})

describe('Get Job Configurations', () => {
  test('Get Job Configurations', async () => {
    const jobsConfigApi = config.getJobsConfigApi()
    const expectedJobs = []
    // No secret substitution
    let job = getJobConfig({
      job_specific_config: `{
        "method": "POST",
        "url": "http://www.google.com"
      }`
    },
    1
    )
    await jobsConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: 'POST',
        url: 'http://www.google.com'
      }
    },
    1
    ))
    // With secret substitution
    job = getJobConfig({
      job_specific_config: `{
        "method": "GET",
        "url": "http://www.cohesity.com",
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key"
        }
      }`
    },
    2
    )
    await jobsConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: 'GET',
        url: 'http://www.cohesity.com',
        auth: {
          method: 'GeneratedBearerToken',
          credentials: {
            user: 'user',
            password: 'password'
          }
        }
      }
    },
    2
    ))
    // With 2 secret substitutions and parameters
    job = getJobConfig({
      job_specific_config: `{
        "method": "GET",
        "url": "http://www.api.com",
        "parameters":{
          "secretParamVaultKey":"secretParam",
          "param1": "value1"
        },
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key"
        }
      }`
    },
    3
    )
    await jobsConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: 'GET',
        url: 'http://www.api.com',
        parameters: {
          secretParam: 'secretParamValue',
          param1: 'value1'
        },
        auth: {
          method: 'GeneratedBearerToken',
          credentials: {
            user: 'user',
            password: 'password'
          }
        }
      }
    },
    3
    ))
    const jobs = await config.getJobConfigs()
    assertProcessedJobConfigs(jobs, expectedJobs)
  })
})
