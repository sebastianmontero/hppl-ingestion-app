module.exports = {
  assertContainsError (validationError, errorMsg) {
    for (const error of validationError.errors) {
      if (error.message.includes(errorMsg)) {
        expect(error.message).toContain(errorMsg)
      }
    }
  }
}
