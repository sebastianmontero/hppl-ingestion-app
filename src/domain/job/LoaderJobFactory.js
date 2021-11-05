const RESTLoaderJob = require('./RESTLoaderJob')
const { SourceType } = require('../../const')
const { InternalError } = require('../../error')

class LoaderJobFactory {
  static getInstance (sourceType, jobConfig, logApi) {
    switch (sourceType) {
      case SourceType.REST:
        return new RESTLoaderJob(jobConfig, logApi)
      default:
        throw new InternalError(`No LoaderJob for source type: ${sourceType}`)
    }
  }
}

module.exports = LoaderJobFactory
