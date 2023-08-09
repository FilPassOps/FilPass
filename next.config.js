const { withSentryConfig } = require('@sentry/nextjs')

const moduleExports = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['en'],
    defaultLocale: 'en',
  },
}

const sentryWebpackPluginOptions = {
  silent: true,
}

module.exports =
  process.env.NODE_ENV === 'production'
    ? withSentryConfig(
        {
          ...moduleExports,
          sentry: {
            hideSourceMaps: true,
          },
        },
        sentryWebpackPluginOptions
      )
    : moduleExports
