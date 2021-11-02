const { CronJob } = require('cron')

class CronTab {
  /**
   * Adds a job to the cronTab
   * @param {string} schedule cron expression
   * @param {function} jobFn function to execute on schedule
   * @returns {CronJob} job handle
   */
  addJob (schedule, jobFn) {
    const job = new CronJob(schedule, jobFn)
    job.start()
    return job
  }
}

module.exports = CronTab
