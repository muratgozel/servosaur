export default (ctx) => {
  return cors({
    maxAge: 3600,
    origin: async (koactx) => {
      try {
        const origin = koactx.request.header.origin
        const origins = JSON.parse( await ctx.redis.get('origins') )

        if (origins.indexOf(origin) !== -1) {
          return origin
        }

        return false
      } catch (e) {
        ctx.log.error(e, `cors middleware raised an error while reading origins from redis.`)
        return false
      }
    }
  })
}
