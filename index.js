const testSetupHelper = require('./test/TestSetupHelper')
const { JobsConfigApi } = require('./src/service')

class Runner {
  async run () {
    const jobsConfigApi = await new JobsConfigApi({
      contract: 'hppljobsconf',
      eosApi: testSetupHelper.eosApi
    })
    await testSetupHelper.setupNodeos()
    await jobsConfigApi.upsert({
      jobName: 'job1',
      jobDescription: 'job1 desc',
      sourceType: 'REST',
      sourceSystemType: 'Cohesity',
      sourceSystemId: 'cluster1',
      endpointId: 'endpoint1',
      schedule: '0 * * * *',
      indexFields: ['index1', 'index2'],
      jobSpecificConfig: `{
        "url":"url",
      }`
    }, 'hppljobsconf')
  }
}

new Runner().run()
