const sleep = require('await-sleep')
const { JobConfig } = require('../../../src/domain/config')
const { VaultKey, RequestMethod } = require('../../../src/const')
const { contractNames, testSetupHelper } = require('../../TestSetupHelper')
const { getJobConfig } = require('../../TestDataFunctions')
const { assertJobConfigs, assertProcessedJobConfigs } = require('../../TestAssertionFunctions')
const { WrappedError } = require('../../../src/error')

jest.setTimeout(20000)

let jobConfig
let jobConfigApi

const mockVault = {
  async read (key) {
    if (key === VaultKey.CONTRACT_KEYS) {
      return {
        keys: ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']
      }
    } else if (key === 'secretParam') {
      return 'secretParamValue'
    } else if (key === 'secretData') {
      return 'secretDataValue'
    } else {
      return {
        user: 'user',
        password: 'password'
      }
    }
  }
}

beforeAll(async () => {
  jobConfigApi = testSetupHelper.jobConfigApi
  await testSetupHelper.setupNodeos()
  jobConfig = new JobConfig({
    vault: mockVault,
    jobConfigApi: jobConfigApi
  })
})

beforeEach(async () => {
  await sleep(500)
  await jobConfigApi.reset(contractNames.jobsconfig)
})

describe('Load Job Configurations', () => {
  test('Load Job Configurations', async () => {
    let jobsToLoad = []
    let expectedJobs = []

    let job = getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.google.com'
      }
    },
    1
    )
    // Adding non string job_specific_config
    jobsToLoad.push(job)
    expectedJobs.push({
      ...job,
      job_specific_config: JSON.stringify(job.job_specific_config)
    })

    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.cohesity.com",
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key1",
          "url": "http://auth.io"
        }
      }`
    },
    2
    )
    // Adding string job_specific_config
    jobsToLoad.push(job)
    expectedJobs.push(job)
    // Adding non string job_specific_configs
    job = getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.api.com',
        params: {
          secretParam: 'secretParamValue1',
          param1: 'value1'
        },
        data: {
          secretData: 'secretDataValue'
        },
        auth: {
          method: 'GeneratedBearerToken',
          credentialsVaultKey: 'key2',
          url: 'http://auth.io'
        }
      }
    },
    3
    )
    jobsToLoad.push(job)
    expectedJobs.push({
      ...job,
      job_specific_config: JSON.stringify(job.job_specific_config)
    })

    // Adding jobs for clean smart contract
    await jobConfig.loadJobConfigs(jobsToLoad)
    let jobs = await jobConfigApi.getAll()
    assertJobConfigs(jobs, expectedJobs)

    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.test.com"
      }`
    },
    4
    )
    jobsToLoad = []
    // Adding string job_specific_config
    jobsToLoad.push(job)
    expectedJobs.push(job)

    // Adding job to existing jobs
    await jobConfig.loadJobConfigs(jobsToLoad)
    jobs = await jobConfigApi.getAll()
    assertJobConfigs(jobs, expectedJobs)

    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.test.com"
      }`
    },
    5
    )
    jobsToLoad = []
    expectedJobs = []
    // Adding string job_specific_config
    jobsToLoad.push(job)
    expectedJobs.push(job)

    // Clearing jobs and adding new ones
    await jobConfig.loadJobConfigs(jobsToLoad, true)
    jobs = await jobConfigApi.getAll()
    assertJobConfigs(jobs, expectedJobs)
  })

  test('Load Job Configurations should fail for invalid job specific config', async () => {
    const jobsToLoad = []
    const expectedJobs = []

    expect.assertions(13)
    let job = getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.test2.com'
      }
    },
    1
    )
    // Adding non string job_specific_config
    jobsToLoad.push(job)
    expectedJobs.push({
      ...job,
      job_specific_config: JSON.stringify(job.job_specific_config)
    })

    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.cohesity.com",
        "auth": {
          "method": "GeneratedBearerToken",
          "url": "http://auth.io"
        }
      }`
    },
    2
    )
    // Adding string job_specific_config
    jobsToLoad.push(job)

    // Adding jobs for clean smart contract
    try {
      await jobConfig.loadJobConfigs(jobsToLoad)
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedError)
    }
    const jobs = await jobConfigApi.getAll()
    assertJobConfigs(jobs, expectedJobs)
  })
})

describe('Load Job Configurations from file', () => {
  test('Load Job Configurations from file', async () => {
    const expectedJobs = []

    let job = getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.file1.com'
      }
    },
    1
    )
    expectedJobs.push({
      ...job,
      job_specific_config: JSON.stringify(job.job_specific_config)
    })

    job = getJobConfig({
      job_specific_config: '{"method": "get", "url": "http://www.cohesity.com", "auth": { "method": "GeneratedBearerToken", "credentialsVaultKey": "key1", "url": "http://auth1.io"}}'
    },
    2
    )
    expectedJobs.push(job)
    // Adding jobs for clean smart contract
    await jobConfig.loadJobConfigsFromFile(testSetupHelper.getAbsolutePath('domain/config/job-configs.json'))
    const jobs = await jobConfigApi.getAll()
    assertJobConfigs(jobs, expectedJobs)
  })

  test('Load Job Configurations should fail for invalid file', async () => {
    expect.assertions(1)

    try {
      await jobConfig.loadJobConfigsFromFile('invalid.json')
    } catch (error) {
      expect(error).toBeInstanceOf(WrappedError)
    }
  })
})

describe('Get Job Configurations', () => {
  test('Get Job Configurations', async () => {
    const jobConfigApi = testSetupHelper.jobConfigApi
    const expectedJobs = []
    // No secret substitution
    let job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.POST}",
        "url": "http://www.google.com"
      }`
    },
    1
    )
    await jobConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.google.com'
      }
    },
    1
    ))
    // With secret substitution
    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.cohesity.com",
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key",
          "url": "http://auth.io"
        }
      }`
    },
    2
    )
    await jobConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: RequestMethod.GET,
        url: 'http://www.cohesity.com',
        auth: {
          method: 'GeneratedBearerToken',
          credentials: {
            user: 'user',
            password: 'password'
          },
          url: 'http://auth.io'
        }
      }
    },
    2
    ))
    // With multiple secret substitutions, params and data
    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.POST}",
        "url": "http://www.api.com",
        "params":{
          "secretParamVaultKey":"secretParam",
          "param1": "value1"
        },
        "data":{
          "secretDataVaultKey":"secretData",
          "data1": "value1"
        },
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key",
          "url": "http://auth.io"
        }
      }`
    },
    3
    )
    await jobConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.api.com',
        params: {
          secretParam: 'secretParamValue',
          param1: 'value1'
        },
        data: {
          secretData: 'secretDataValue',
          data1: 'value1'
        },
        auth: {
          method: 'GeneratedBearerToken',
          credentials: {
            user: 'user',
            password: 'password'
          },
          url: 'http://auth.io'
        }
      }
    },
    3
    ))
    const jobs = await jobConfig.getJobConfigs()
    assertProcessedJobConfigs(jobs, expectedJobs)
  })
  test('Get Job Configurations should fail for invalid job specific configuration', async () => {
    const jobConfigApi = testSetupHelper.jobConfigApi
    const expectedJobs = []

    expect.assertions(1)
    let job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.POST}",
        "url": "http://www.test3.com"
      }`
    },
    1
    )
    await jobConfigApi.upsert(job)
    expectedJobs.push(getJobConfig({
      job_specific_config: {
        method: RequestMethod.POST,
        url: 'http://www.test3.com'
      }
    },
    1
    ))
    // Invalid job configuration
    job = getJobConfig({
      job_specific_config: `{
        "method": "${RequestMethod.GET}",
        "url": "http://www.cohesity.com",
        "data": {
          "prop1": "Should not be present for GET method"
        },
        "auth": {
          "method": "GeneratedBearerToken",
          "credentialsVaultKey": "key",
          "url": "http://auth.io"
        }
      }`
    },
    2
    )
    await jobConfigApi.upsert(job)

    try {
      await jobConfig.getJobConfigs()
    } catch (err) {
      expect(err).toBeInstanceOf(WrappedError)
    }
  })
})
