function assertContainsError (validationError, errorMsg) {
  for (const error of validationError.errors) {
    if (error.message.includes(errorMsg)) {
      expect(error.message).toContain(errorMsg)
    }
  }
}

function assertJobConfigs (actual, expected) {
  this.assertBaseJobConfigs(actual, expected, assertJobConfig)
}

function assertProcessedJobConfigs (actual, expected) {
  assertBaseJobConfigs(actual, expected, assertProcessedJobConfig)
}

function assertBaseJobConfigs (actual, expected, jobSpecificAssertFn) {
  expect(actual).not.toBeNull()
  expect(actual).toBeInstanceOf(Array)
  expect(actual).toHaveLength(expected.length)
  for (const [i, e] of expected.entries()) {
    jobSpecificAssertFn(actual[i], e)
  }
}

function assertJobConfig (actual, expected) {
  assertBaseJobConfig(actual, expected)
  expect(actual.job_specific_config).toBe(expected.job_specific_config)
}

function assertProcessedJobConfig (actual, expected) {
  expect(actual).toBeDefined()
  expect(expected).toBeDefined()
  expect(actual.job_specific_config).toEqual(expected.job_specific_config)
}

function assertBaseJobConfig (actual, expected) {
  expect(actual.job_name).toBe(expected.job_name)
  expect(actual.job_description).toBe(expected.job_description)
  expect(actual.source_type).toBe(expected.source_type)
  expect(actual.source_system_type).toBe(expected.source_system_type)
  expect(actual.source_system_id).toBe(expected.source_system_id)
  expect(actual.endpoint_id).toBe(expected.endpoint_id)
  expect(actual.schedule).toBe(expected.schedule)
  expect(actual.index_fields).toEqual(expected.index_fields)
}

module.exports = {
  assertContainsError,
  assertJobConfigs,
  assertProcessedJobConfigs,
  assertJobConfig,
  assertProcessedJobConfig
}
