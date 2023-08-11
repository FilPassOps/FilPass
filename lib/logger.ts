import winston from 'winston'

const { combine, timestamp, colorize, label } = winston.format

const winstonProdOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    label({
      label: '[LOGGER]',
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ label, timestamp, level, message, ...metadata }) => {
      let logString = `${label} ${timestamp} [${level}]: ${message}`
      if (metadata) {
        logString += '\n' + JSON.stringify(metadata, null, 2).replace(/\\n/g, '\n')
      }
      return logString
    }),
  ),
  transports: [new winston.transports.Console({ format: winston.format.align() })],
}

const winstonDevOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'debug',
  format: combine(
    label({
      label: '[LOGGER]',
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ label, timestamp, level, message, ...metadata }) => {
      let logString = `${label} ${timestamp} [${level}]: ${message}`
      if (metadata) {
        logString += '\n' + JSON.stringify(metadata, null, 2).replace(/\\n/g, '\n')
      }
      return logString
    }),
    colorize({
      all: true,
    }),
  ),
  transports: [new winston.transports.Console()],
}

export const logger = winston.createLogger(process.env.NODE_ENV === 'production' ? winstonProdOptions : winstonDevOptions)
