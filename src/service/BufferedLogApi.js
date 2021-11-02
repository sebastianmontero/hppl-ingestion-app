class BufferedLogApi {
  constructor ({
    logApi,
    intervalSeconds
  }) {
    this.logApi = logApi
    this.interval = intervalSeconds * 1000
    this.buffer = []
    this._scheduleBufferProcessing()
  }

  log (data) {
    this.buffer.push(data)
  }

  async _processBuffer () {
    try {
      while (this.buffer.length) {
        await this.logApi.log(this.buffer[0])
        this.buffer.shift()
      }
    } catch (err) {
      console.log(`Error logging payload: ${JSON.stringify(this.buffer[0], null, 4)}`, err)
    }
    this._scheduleBufferProcessing()
  }

  _scheduleBufferProcessing () {
    setTimeout(() => {
      this._processBuffer()
    }, this.interval)
  }
}

module.exports = BufferedLogApi
