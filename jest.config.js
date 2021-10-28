// Sync object
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  transformIgnorePatterns: [
    '/node_modules/(?!(node-fetch|fetch-blob)/)'
  ],
  transform: {
    '^.+\\.[t|j]sx?$': 'babel-jest'
  }

}

module.exports = config
