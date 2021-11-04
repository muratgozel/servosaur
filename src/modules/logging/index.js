import path from 'path'
import pino from 'pino'

export function configure(config) {
  const transports = []

  if (process.env.NODE_ENV == 'development') {
    transports.push({
      target: 'pino-pretty',
      level: 'trace',
      options: {
        colorize: true
      }
    })
  }

  transports.push({
    target: new URL('./transports/console.mjs', import.meta.url).pathname,
    level: 'trace'
  })

  if (config.get('sentryDsn')) {
    transports.push({
      target: new URL('./transports/sentry.mjs', import.meta.url).pathname,
      level: 'error',
      options: {
        dsn: config.get('sentryDsn'),
        tracesSampleRate: 0.2
      }
    })
  }

  return pino({
    redact: ['card'],
    transport: {
      targets: transports
    }
  })
}
