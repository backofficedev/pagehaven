import * as Sentry from '@sentry/tanstackstart-react'

const dsn = process.env.VITE_SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
    sendDefaultPii: true,
  })
}
