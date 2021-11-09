const config = require('./config')
const winston = require('winston')

const {
  format: {
    combine,
    printf,
    timestamp
  }
} = winston
require('winston-daily-rotate-file')

const myFormat = printf(({ level, message, timestamp, error, errord, ...metadata }) => {
  let msg = `${timestamp} ${level}: ${message}`
  let detailed = false
  if (errord) {
    error = errord
    detailed = true
  }
  if (error) {
    msg += ' Error data: [\n'
    if (detailed && error.toDetailedString) {
      msg += error.toDetailedString()
    } else if (detailed && error.stack) {
      msg += error.stack
    } else {
      msg += error.message || error
    }
    msg += '\n]'
  }
  if (metadata) {
    const metaStr = JSON.stringify(metadata)
    if (metaStr.length > 2) {
      msg += ' ' + metaStr
    }
  }
  return msg
})

class Logger {
  constructor () {
    this.level = config.getOr('logs.level', 'info')
    this.dir = config.getOr('logs.dir', '.')
    this._setUpUnhandeledErrorHandlers()
    this.transports = this._getTransports()
  }

  getLogger () {
    return winston.createLogger({
      level: this.level,
      format: this._getFormats(),
      transports: this.transports
    })
  }

  _setUpUnhandeledErrorHandlers () {
    winston.add(
      this._getDailyRotateFileTransport({
        filename: this._getFileName('unhandeled-exceptions'),
        handleExceptions: true,
        handleRejections: true
      })
    )
    if (!this._isProduction()) {
      winston.add(new winston.transports.Console({
        handleExceptions: true,
        handleRejections: true
      }))
    }
  }

  _getTransports () {
    const transports = [
      this._getDailyRotateFileTransport({
        filename: this._getFileName('all'),
        level: this.level
      }),
      this._getDailyRotateFileTransport({
        filename: this._getFileName('error'),
        level: 'error'
      })
    ]

    if (!this._isProduction()) {
      transports.push(new winston.transports.Console({}))
    }
    return transports
  }

  _getFormats () {
    return combine(
      timestamp(),
      myFormat
    )
  }

  _getDailyRotateFileTransport (props) {
    return new winston.transports.DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '20d',
      dirname: this.dir,
      ...props
    })
  }

  _getFileName (suffix) {
    return `ingestion-app-${suffix}-%DATE%.log`
  }

  _isProduction () {
    return process.env.NODE_ENV === 'production'
  }
}

module.exports = new Logger().getLogger()
