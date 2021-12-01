// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|fetch-blob)/)'
  ],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest'
  },
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: 'Test Report'
    }]
  ]

}

module.exports = config
