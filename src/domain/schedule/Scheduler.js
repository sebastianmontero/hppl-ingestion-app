const CronTab = require('./CronTab')
const { LoaderJobFactory } = require('../job')

class Scheduler {
  constructor (config) {
    this.config = config
    this.cronTab = new CronTab()
  }

  async schedule () {
    const jobConfs = await this.config.getJobConfigs()

    for (const jobConf of jobConfs) {
      const job = LoaderJobFactory.getInstance(jobConf.source_type, jobConf, this.config.getBufferedLogApi())
      this.cronTab.addJob(job.schedule, function () {
        job.run()
      })
    }
  }
}

module.exports = Scheduler
