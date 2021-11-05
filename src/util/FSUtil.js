const fs = require('fs/promises')
const os = require('os')
const path = require('path')

class FSUtil {
  static async createTmpDir (prefix) {
    return fs.mkdtemp(path.join(os.tmpdir(), prefix))
  }

  static async readJSON (file) {
    const data = await fs.readFile(file)
    return JSON.parse(data)
  }
}

module.exports = FSUtil
