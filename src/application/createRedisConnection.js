import Redis from 'ioredis'

export default async function createRedisConnection(config, log) {
  return new Promise(async function(resolve, reject) {
    const connstr = config.get('redisConnStr')
    const client = new Redis(connstr, {
      lazyConnect: true,
      //reconnectOnError: false,
      retryStrategy: false
    })
    let timesTried = 0

    client.on('connect', () => {
      return resolve(client)
    })

    client.on('error', () => {

    })

    async function connect() {
      timesTried += 1

      if (timesTried > 5) {
        log.info('Skipped redis connection.')
        return resolve(client)
      }

      try {
        await client.connect()
        return resolve(client)
      } catch (e) {
        log.error(e, 'Redis connection failed. This maybe because of the service isn\'t ready yet. Will try to connect again in 3 seconds.')
        setTimeout(async () => await connect(), 3000)
      }
    }

    await connect()
  })
}
