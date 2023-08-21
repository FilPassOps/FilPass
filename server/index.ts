import { loadEnvConfig } from '@next/env'
import express from 'express'
import { logger } from 'lib/logger'
import next from 'next'
import schedule from 'node-schedule'
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production')

const port = parseInt(process.env.PORT || '3000', 10)
const app = next({ dev: process.env.IS_DEV === 'true' })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, () => {
    logger.info(`> Ready on http://localhost:${port}`)
  })

  import('jobs/index')
  import('./multiforwarder-event-listener')
})

function handleExit(signal: string) {
  logger.info(`\r\n> Received ${signal}. Shutting down gracefully...`)
  schedule
    .gracefulShutdown()
    .then(() => logger.info('> Schedule shutdown successful.'))
    .catch(() => logger.info('> Schedule shutdown failed.'))
    .finally(() => {
      logger.info('> Exiting...')
      process.exit(0)
    })
}

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
