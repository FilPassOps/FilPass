import { loadEnvConfig } from '@next/env'
import express from 'express'
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
    console.log(`> Ready on http://localhost:${port}`)
  })

  import('jobs/index')
  import('./multiforwarder-event-listener')
})

function handleExit(signal: string) {
  console.log(`\r\n> Received ${signal}. Shutting down schedule gracefully...`)
  schedule
    .gracefulShutdown()
    .then(() => console.log('> Schedule shutdown successful.'))
    .catch(() => console.log('> Schedule shutdown failed.'))
    .finally(() => {
      console.log('> Exiting...')
      process.exit(0)
    })
}

process.on('SIGINT', handleExit)
process.on('SIGTERM', handleExit)
