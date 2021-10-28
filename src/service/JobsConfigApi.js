/* eslint-disable camelcase */
const KVTableApi = require('./KVTableApi')

class JobsConfigApi extends KVTableApi {
  constructor ({
    contract,
    eosApi
  }) {
    super({
      contract,
      eosApi
    })
  }

  async reset (authorization) {
    return this.simpleTrx({
      name: 'resetjobs',
      data: {},
      authorization
    })
  }

  async upsert ({
    job_id,
    job_name,
    job_description,
    source_type,
    source_system_type,
    source_system_id,
    endpoint_id,
    schedule,
    index_fields,
    job_specific_config
  },
  authorization) {
    let action = 'addjob'
    if (job_id != null) {
      action = 'updatejob'
    }
    return this.simpleTrx({
      name: action,
      data: {
        job_id,
        job_name,
        job_description,
        source_type,
        source_system_type,
        source_system_id,
        endpoint_id,
        schedule,
        index_fields,
        job_specific_config
      },
      authorization
    })
  }

  async delete (job_id, authorization) {
    return this.simpleTrx({
      name: 'deletejob',
      data: {
        job_id
      },
      authorization
    })
  }

  async getAll () {
    return this.getAllTableRows({
      indexName: 'jobid'
    })
  }

  async getLast () {
    return this.getSingleTableRow({
      indexName: 'jobid',
      reverse: true
    })
  }
}

module.exports = JobsConfigApi
