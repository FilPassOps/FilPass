import winston from 'winston'

const { combine, timestamp, colorize, label } = winston.format

// Add this custom format to handle errors properly
const errorStackFormat = winston.format(info => {
  if (info instanceof Error || info.error instanceof Error) {
    const error = info instanceof Error ? info : info.error
    return {
      ...info,
      message: info.message,
      stack: error.stack,
      ...(error.details && { details: error.details }),
      ...(error.status && { status: error.status }),
      ...(error.type && { type: error.type }),
      ...error
    }
  }
  return info
})

const winstonProdOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errorStackFormat(),
    label({
      label: '[LOGGER]',
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ label, timestamp, level, message, ...metadata }) => {
      let logString = `${label} ${timestamp} [${level}]: ${message}`
      if (Object.keys(metadata).length > 0) {
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
    errorStackFormat(),
    label({
      label: '[LOGGER]',
    }),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ label, timestamp, level, message, ...metadata }) => {
      let logString = `${label} ${timestamp} [${level}]: ${message}`
      if (Object.keys(metadata).length > 0) {
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
