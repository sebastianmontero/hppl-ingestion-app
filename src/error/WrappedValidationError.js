const WrappedError = require('./WrappedError')
class WrappedValidationError extends WrappedError {
  _decorateMessage () {
    super._decorateMessage()
    console.log(this.cause)
    let str = '\nErrors: \n'
    for (const err of this.cause.errors) {
      str += `${err.stack}\n`
    }
    this.message += str
  }
}

module.exports = WrappedValidationError
