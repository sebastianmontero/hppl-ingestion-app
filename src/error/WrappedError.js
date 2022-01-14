class WrappedError extends Error {
  constructor (message, cause) {
    super(message)
    this.cause = cause
    this._decorateMessage()
  }

  _decorateMessage () {
    let str = super.toString()
    if (this.cause) {
      str += `\nCause: ${this.cause.toDetailedString ? this.cause.toDetailedString() : JSON.stringify(this.cause, null, 4)}`
    }
    this.message = str
  }

  toDetailedString () {
    let str = this.stack
    if (this.cause) {
      str += '\n Cause: '
      if (this.cause.toDetailedString) {
        str += this.cause.toDetailedString()
      } else if (this.cause.stack) {
        str += this.cause.stack
      } else {
        str += this.cause.toString ? this.cause.toString() : JSON.stringify(this.cause, null, 4)
      }
    }
    return str
  }
}

module.exports = WrappedError
