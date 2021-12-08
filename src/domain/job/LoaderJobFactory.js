const RESTLoaderJob = require('./RESTLoaderJob')
const { SourceType } = require('../../const')
const { InternalError } = require('../../error')
const { ValueFunctionResolver } = require('../')

class LoaderJobFactory {
  static getInstance (sourceType, jobConfig, logApi) {
    switch (sourceType) {
      case SourceType.REST:
        return new RESTLoaderJob({
          config: jobConfig,
          logApi,
          valueFnResolver: ValueFunctionResolver
        })
      default:
        throw new InternalError(`No LoaderJob for source type: ${sourceType}`)
    }
  }
}

module.exports = LoaderJobFactory
