const { ContentType, SourceSystemType, SourceType } = require('../src/const')

module.exports = {
  getJobConfig (override, counter) {
    counter = counter || 1
    return {
      job_name: `name ${counter}`,
      job_description: `job description ${counter}`,
      source_type: SourceType.REST,
      content_type: ContentType.JSON,
      source_system_type: SourceSystemType.COHESITY,
      source_system_id: `cluster ${counter}`,
      endpoint_id: `endpoint ${counter}`,
      schedule: '0 * * * *',
      index_fields: ['index1', 'index2'],
      job_specific_config: '{}',
      ...override
    }
  },
  addBearerTokenHeader (accessToken, requestConfig) {
    requestConfig = requestConfig || {}
    requestConfig.headers = {
      ...requestConfig.headers,
      Authorization: `Bearer ${accessToken}`
    }
    return requestConfig
  }
}
