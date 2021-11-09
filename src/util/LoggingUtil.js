class LoggingUtil {
  static getJobIdentifier (config) {
    return `${config.job_name}(${config.job_id})`
  }
}

module.exports = LoggingUtil
