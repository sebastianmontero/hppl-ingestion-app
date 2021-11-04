const fs = require('fs/promises')
const path = require('path')
const { exec, spawn } = require('child_process')
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig')
const { JobConfigApi, LogApi, EOSApi } = require('../src/service')
const { FSUtil } = require('../src/util')

const EOSIO_KEY = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
const PUBLIC_EOSIO_KEY = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'

const contractNames = {
  jobsconfig: 'hppljobsconf',
  logger: 'hpplapiloggr'
}

class TestSetupHelper {
  constructor () {
    this.tmpDirs = []

    const signatureProvider = new JsSignatureProvider([EOSIO_KEY])
    this.eosApi = new EOSApi({
      endpoint: 'http://localhost:8888',
      signatureProvider
    })

    this.jobConfigApi = new JobConfigApi({
      contract: contractNames.jobsconfig,
      eosApi: this.eosApi
    })

    this.logApi = new LogApi({
      contract: contractNames.logger,
      eosApi: this.eosApi
    })
  }

  async setupNodeos () {
    const cwd = this._getAbsolutePath('nodeos')
    await this._exec('docker-compose down -v', cwd)
    await this._spawn('docker-compose', ['up'], cwd)
    await this._deployContract(contractNames.jobsconfig, 'jobsconfig')
    await this._deployContract(contractNames.logger, 'logger')
  }

  async createTmpDir () {
    const tmpdir = await FSUtil.createTmpDir('test')
    this.tmpDirs.push(tmpdir)
    return tmpdir
  }

  async deleteTmpDirs () {
    const promises = []
    for (const tmpDir of this.tmpDirs) {
      try {
        promises.push(fs.rm(tmpDir, { recursive: true }))
      } catch (error) {
        console.log(`failed deleting tmp dir: ${tmpDir}, error: `, error)
      }
    }

    await Promise.all(promises)
  }

  async _deployContract (account, contract) {
    await this.eosApi.createAccount(account, PUBLIC_EOSIO_KEY, false)
    await this.eosApi.deployContract(account, this._getAbsolutePath(`artifacts/${contract}.wasm`), this._getAbsolutePath(`artifacts/${contract}.abi`))
  }

  async _exec (cmd, cwd) {
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        {
          cwd
        },
        (error, stdout, stderr) => {
          if (stderr) {
            console.log(`StdErr: ${stderr}`)
          }
          if (stdout) {
            console.log(`StdOut: ${stdout}`)
          }
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
    })
  }

  async _spawn (cmd, args, cwd) {
    return new Promise((resolve, reject) => {
      let failed = false
      const subprocess = spawn(
        cmd,
        args,
        {
          cwd
        })
      // subprocess.stdout.on('data', (data) => {
      //   console.log(`stdout: ${data}`)
      // })

      // subprocess.stderr.on('data', (data) => {
      //   console.error(`stderr: ${data}`)
      // })
      subprocess.on('error', (err) => {
        failed = true
        console.log('Failed to start process: ', err)
      })
      setTimeout(() => {
        if (failed) {
          reject(new Error('failed to start process'))
        } else {
          resolve()
        }
      }, 8000)
    })
  }

  _getAbsolutePath (relativePath) {
    return path.join(__dirname, relativePath)
  }
}

module.exports = {
  testSetupHelper: new TestSetupHelper(),
  contractNames
}
