const fs = require('fs/promises')
const os = require('os')
const path = require('path')

class FSUtil {
  static async createTmpDir (prefix) {
    return fs.mkdtemp(path.join(os.tmpdir(), prefix))
  }
}

module.exports = FSUtil
