/* eslint-disable camelcase */
const { InternalError } = require('../../error')
const { ParserFactory } = require('../parser')

class LoaderJob {
  constructor (config, logApi) {
    this.config = config
    this.logApi = logApi
  }

  async run () {
    try {
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
      await this.logApi.log(log)
    } catch (err) {
      console.log(`job run for: ${JSON.stringify(this.config, null, 4)}) failed, error:`, err)
      if (err instanceof InternalError) {
        throw err
      }
    }
  }

  async _fetchPayload () {
    throw new InternalError('fetchPayload method of the LoaderJob class must be overriden by subclass')
  }

  _getTimestamp () {
    return new Date().toISOString()
  }

  _getGenericField (payload, pos) {
    const indexField = this._getIndexField(pos)
    return indexField && payload[indexField] ? payload[indexField] : ''
  }

  _hasIndexField (pos) {
    return this.config.index_fields.length > pos
  }

  _getIndexField (pos) {
    return this._hasIndexField(pos) ? this.config.index_fields[pos] : null
  }
}

module.exports = LoaderJob
