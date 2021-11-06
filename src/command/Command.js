class Command {
  buildCommand (yargs) {
    throw new Error('buildCommand method of the Command class should be overriden by subclasses')
  }
}

module.exports = Command
