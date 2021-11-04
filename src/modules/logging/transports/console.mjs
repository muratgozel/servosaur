import { Writable } from 'stream'
import { levels } from 'pino'

export default (options) => {
  const consoleTransport = new Writable({
    write (chunk, enc, cb) {
      const defaultProps = ['level', 'time', 'pid', 'hostname', 'err', 'msg']
      const obj = JSON.parse(chunk.toString())
      const msg = []
      if (obj.msg) {
        msg.push(
          process.env.NODE_ENV == 'development' ? JSON.stringify(obj.msg, null, 2) : JSON.stringify(obj.msg)
        )
      }
      if (obj.err && obj.err.message) msg.push((msg.length > 0 ? ' ' : '') + obj.err.message)

      console.log(`[${obj.time}] ${levels.labels[obj.level].toUpperCase()} ${msg.join('')}`)

      if (obj.err && obj.err.stack) {
        obj.err.stack.split(/[\r\n]+/g)
          .filter(line => line)
          .map(line => line.trim())
          .map(line => console.log(`  ${line}`))
      }

      const extraProps = Object.keys(obj)
        .filter(p => defaultProps.indexOf(p) === -1)
        .map(p => console.log(`  - ${p}: ${JSON.stringify(obj[p])}`))

      cb()
    }
  })

  return consoleTransport
}
