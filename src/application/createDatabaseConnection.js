import {createPool, createTypeParserPreset} from 'slonik'

export default async function createDatabaseConnection(config, log) {
  return new Promise(async function(resolve, reject) {
    const connstr = config.get('pgConnStr')
    const conncfg = {
      typeParsers: [
        ...createTypeParserPreset()
      ].concat([
        {
          name: 'timestamptz',
          parse: v => v
        }
      ])
    }
    let timesTried = 0

    async function onConnect(pgconn) {
      return Promise.resolve()
    }

    async function connect(connstr) {
      timesTried += 1

      if (timesTried > 5) {
        log.info('Skipped database connection.')
        return resolve(null)
      }

      try {
        const pool = createPool(connstr, conncfg)
        try {
          await pool.connect(onConnect)
          return resolve(pool)
        } catch (e) {
          log.error(e, 'Database connection failed. This maybe because of the service isn\'t ready yet. Will try to connect again in 3 seconds.')
          setTimeout(async () => await connect(connstr), 3000)
        }
      } catch (e) {
        log.error(e, 'Database pool connection failed. This maybe because of the service isn\'t ready yet. Will try to connect again in 3 seconds.')
        setTimeout(async () => await connect(connstr), 3000)
      }
    }

    await connect(connstr)
  })
}
