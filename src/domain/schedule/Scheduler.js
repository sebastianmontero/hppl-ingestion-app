const { LoaderJobFactory } = require('../job')
const { WrappedError } = require('../../error')

class Scheduler {
  constructor ({
    logApi,
    jobConfig,
    cronTab
  }) {
    this.logApi = logApi
    this.jobConfig = jobConfig
    this.cronTab = cronTab
  }

  async schedule () {
    try {
      const jobConfs = await this.jobConfig.getJobConfigs()
      if (!jobConfs.length) {
        throw new Error('No jobs to schedule')
      }
      await this.logApi.start()
      for (const jobConf of jobConfs) {
        console.log(`Running job: ${jobConf.job_name}(${jobConf.job_id}) with schedule: ${jobConf.schedule}`)
        const job = LoaderJobFactory.getInstance(jobConf.source_type, jobConf, this.logApi)
        this.cronTab.addJob(jobConf.schedule, function () {
          job.run()
        })
      }
    } catch (error) {
      throw new WrappedError('failed scheduling jobs', error)
    }
  }
}

module.exports = Scheduler
