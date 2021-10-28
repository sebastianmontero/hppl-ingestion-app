module.exports = {
  getJobConfig (override) {
    return {
      job_name: 'name',
      job_description: 'job description',
      source_type: 'REST',
      source_system_type: 'Cohesity',
      source_system_id: 'cluster1',
      endpoint_id: 'endpoint1',
      schedule: '0 * * * *',
      index_fields: ['index1', 'index2'],
      job_specific_config: '{}',
      ...override
    }
  }
}
