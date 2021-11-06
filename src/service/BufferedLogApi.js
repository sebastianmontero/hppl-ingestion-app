const { ExternalError, InternalError } = require('../error')

class BufferedLogApi {
  constructor ({
    logApi,
    queue,
    intervalSeconds
  }) {
    this.logApi = logApi
    this.interval = intervalSeconds * 1000
    this.queue = queue
    this.timeoutId = null
    this.stopped = true
  }

  async start () {
    if (this.stopped) {
      await this.queue.init()
      this.stopped = false
      this._scheduleBufferProcessing()
    }
  }

  stop () {
    this.stopped = true
    clearTimeout(this.timeoutId)
  }

  async log (data) {
    await this.queue.push(data)
  }

  async _processBuffer () {
    try {
      let length = await this.queue.length()
      while (length > 0) {
        while (length > 0) {
          if (this.stopped) {
            return
          }
          const trx = await this.queue.trxPop()
          try {
            const obj = trx.getObj()
            console.log(`Logging payload: ${JSON.stringify(obj, null, 4)}`)
            await this.logApi.log(obj)
          } catch (err) {
            await trx.rollback()
            throw new ExternalError('failed logging payload', err)
          }
          await trx.commit()
          length--
        }
        length = await this.queue.length()
      }
    } catch (err) {
      const errorMsg = 'failed logging payload'
      console.log(errorMsg, err)
      if (err instanceof InternalError) {
        throw new InternalError(errorMsg, err)
      }
    }
    this._scheduleBufferProcessing()
  }

  _scheduleBufferProcessing () {
    this.timeoutId = setTimeout(() => {
      this._processBuffer()
    }, this.interval)
  }
}

module.exports = BufferedLogApi
