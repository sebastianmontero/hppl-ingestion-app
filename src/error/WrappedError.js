class WrappedError extends Error {
  constructor (message, cause) {
    super(message)
    this.cause = cause
    this._decorateMessage()
  }

  _decorateMessage () {
    let str = super.toString()
    if (this.cause) {
      str += `\nCause: ${this.cause.toString ? this.cause.toString() : this.cause}`
    }
    this.message = str
  }
}

module.exports = WrappedError
