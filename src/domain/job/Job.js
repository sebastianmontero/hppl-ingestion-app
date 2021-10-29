const { ParserFactory } = require('../parser')

class Job {
  constructor (config) {
    this.config = config
  }

  async run () {

  }

  async fetchPayload () {
    throw new Error('fetchPayload method of the Job class must be overriden by subclass')
  }
}

module.exports = Job
