// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (process.env.ENV_NAME === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN || 'https://63c4a1ee976145538d3122b2391e4161@o1096401.ingest.sentry.io/6116984',
    tracesSampleRate: 1.0,
    environment: 'production',
  })
}
