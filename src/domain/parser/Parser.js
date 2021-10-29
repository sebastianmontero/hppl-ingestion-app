class Parser {
  parse (payload) {
    throw new Error('parse method of the Parser class must be overriden by subclass')
  }
}

module.exports = Parser
