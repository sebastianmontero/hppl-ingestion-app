const { config } = require('../service')

const {
  winston,
  format: {
    combine,
    errors,
    label,
    printf,
    timestamp
  }
} = require('winston')
require('winston-daily-rotate-file')

const fileTransportBaseConfig = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '50m',
  maxFiles: '20d',
  dirname: this.dir
}

const myFormat = printf(({ level, message, label, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${label}] ${level}: ${message}`
  if (metadata) {
    msg += JSON.stringify(metadata)
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

  getLogger (fileName) {

  }

  _setUpUnhandeledErrorHandlers () {
    winston.add(
      new winston.transports.DailyRotateFile({
        ...fileTransportBaseConfig,
        filename: this._getFileName('unhandeled-exceptions'),
        handleExceptions: true,
        handleRejections: true
      })
    )
  }

  _getTransports () {
    const transports = [
      new winston.transports.DailyRotateFile({
        ...fileTransportBaseConfig,
        filename: this._getFileName('all'),
        level: this.level
      }),
      new winston.transports.DailyRotateFile({
        ...fileTransportBaseConfig,
        filename: this._getFileName('error'),
        level: 'error'
      })
    ]

    if (process.env.NODE_ENV !== 'production') {
      transports.push(new winston.transports.Console({}))
    }
    return transports
  }

  _getFormats (fileName) {
    return combine(
      label({
        label: fileName
      }),
      timestamp(),
      errors({ stack: true }),
      myFormat()
    )
  }

  _getFileName (suffix) {
    return `ingestion-app-${suffix}-%DATE%.log`
  }
}

module.exports = new Logger()
