import { Writable } from 'stream'
import * as Sentry from "@sentry/node"
import Tracing from "@sentry/tracing"
import { errorkit } from 'basekits'

export default (options) => {
  Sentry.init({
    dsn: options.sentryDsn,
    tracesSampleRate: 0.2
  })

  const sentryTransport = new Writable({
    write (chunk, enc, cb) {
      const obj = JSON.parse(chunk.toString())
      if (obj.level >= 50) {
        const err = obj.err ? errorkit.errorifyObject(obj.err) : new Error(obj.msg)
        Sentry.captureException(err)
      }

      cb()
    }
  })

  return sentryTransport
}
