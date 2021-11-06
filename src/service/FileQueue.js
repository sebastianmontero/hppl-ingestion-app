const fs = require('fs/promises')
const { Queue } = require('file-queue')
const { InternalError } = require('../error')

class FileQueue {
  constructor (path) {
    this.path = path
    this.queue = null
  }

  async init () {
    if (this.queue) {
      return
    }
    await fs.mkdir(this.path, {
      recursive: true
    })
    return new Promise((resolve, reject) => {
      this.queue = new Queue(this.path, (err) => {
        if (err) {
          reject(new InternalError('failed creating file queue', err))
        } else {
          resolve()
        }
      })
    })
  }

  async pop () {
    return new Promise((resolve, reject) => {
      this.queue.pop((err, obj) => {
        if (err) {
          reject(new InternalError('failed popping element from queue', err))
        } else {
          resolve(obj)
        }
      })
    })
  }

  async trxPop () {
    return new Promise((resolve, reject) => {
      this.queue.tpop((err, obj, commit, rollback) => {
        if (err) {
          reject(new InternalError('failed transactionally popping element from queue', err))
        } else {
          resolve(new QueuePopTrx({
            obj,
            commit,
            rollback
          }))
        }
      })
    })
  }

  async push (obj) {
    return new Promise((resolve, reject) => {
      this.queue.push(obj, (err) => {
        if (err) {
          reject(new InternalError(`failed pushing element into queue, element: ${JSON.stringify(obj, null, 4)}`, err))
        } else {
          resolve()
        }
      })
    })
  }

  async length () {
    return new Promise((resolve, reject) => {
      this.queue.length((err, length) => {
        if (err) {
          reject(new InternalError('failed getting queue length', err))
        } else {
          resolve(length)
        }
      })
    })
  }

  async clear () {
    return new Promise((resolve, reject) => {
      this.queue.clear((err) => {
        if (err) {
          reject(new InternalError('failed clearing queue', err))
        } else {
          resolve()
        }
      })
    })
  }
}

module.exports = FileQueue

class QueuePopTrx {
  constructor ({
    obj,
    commit,
    rollback
  }
  ) {
    this.obj = obj
    this._commit = commit
    this._rollback = rollback
  }

  getObj () {
    return this.obj
  }

  async commit () {
    return new Promise((resolve, reject) => {
      this._commit((err) => {
        if (err) {
          reject(new InternalError('failed commiting queue transaction', err))
        } else {
          resolve()
        }
      })
    })
  }

  async rollback () {
    return new Promise((resolve, reject) => {
      this._rollback((err) => {
        if (err) {
          reject(new InternalError('failed rolling back queue transaction', err))
        } else {
          resolve()
        }
      })
    })
  }
}
