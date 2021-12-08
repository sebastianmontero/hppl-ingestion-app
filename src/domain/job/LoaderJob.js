/* eslint-disable camelcase */
const lget = require('lodash.get')
const { InternalError } = require('../../error')
const { ParserFactory } = require('../parser')
const { logger } = require('../../service')
const { LoggingUtil } = require('../../util')

class LoaderJob {
  constructor ({
    config,
    logApi,
    valueFnResolver
  }) {
    this.config = config
    this.logApi = logApi
    this.valueFnResolver = valueFnResolver
  }

  async run () {
    try {
      logger.info(`Running job: ${this._getJobIdentifier()}... `)
      let payload = await this._fetchPayload()
      const parser = ParserFactory.getInstance(this.config.content_type)
      payload = parser.parse(payload)
      const {
        source_system_type,
        source_system_id,
        endpoint_id
      } = this.config

      const log = {
        source_system_type,
        source_system_id,
        endpoint_id,
        generic_field_1: this._getGenericField(payload, 0),
        generic_field_2: this._getGenericField(payload, 1),
        generic_field_3: this._getGenericField(payload, 2),
        fetch_timestamp: this._getTimestamp(),
        payload: JSON.stringify(payload)
      }
      logger.info(`Job: ${this._getJobIdentifier()} logging payload ${JSON.stringify(log, null, 4)}`)
      await this.logApi.log(log)
    } catch (err) {
      console.log(`job run for: ${JSON.stringify(this.config, null, 4)}) failed, error:`, err)
      if (err instanceof InternalError) {
        logger.warn(`Job: ${this._getJobIdentifier()} run failed, an internal error occured`, { errord: err })
        throw err
      } else {
        logger.warn(`Job: ${this._getJobIdentifier()} run failed, will retry in next cycle`, { errord: err })
      }
    }
  }

  async _fetchPayload () {
    throw new InternalError('fetchPayload method of the LoaderJob class must be overriden by subclass')
  }

  _getTimestamp () {
    let isoDate = new Date().toISOString()
    isoDate = isoDate.slice(0, isoDate.length - 1)
    return new Date(isoDate)
  }

  _getGenericField (payload, pos) {
    const indexField = this._getIndexField(pos)
    if (indexField) {
      return lget(payload, indexField, '')
    }
    return ''
  }

  _hasIndexField (pos) {
    return this.config.index_fields.length > pos
  }

  _getIndexField (pos) {
    return this._hasIndexField(pos) ? this.config.index_fields[pos] : null
  }

  _getJobIdentifier () {
    return LoggingUtil.getJobIdentifier(this.config)
  }
}

module.exports = LoaderJob
