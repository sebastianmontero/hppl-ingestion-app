class WrappedError extends Error {
  constructor (message, cause) {
    super(message)
    this.cause = cause
  }

  toString () {
    let str = super.toString()
    if (this.cause) {
      str += `\nCause: ${this.cause}`
    }
    return str
  }
}

module.exports = WrappedError
