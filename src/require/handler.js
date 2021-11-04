import {URL} from 'url'
import runController from '../application/runController.js'

export default async (ctx, controller, payload={}, settings={}) => {
  // create request and response contexes first
  // these are specific to the application and
  // independent from the server tool (koa, etc.)
  const req = new RequestContext()
  const res = new ResponseContext()

  // send the response whenever application sends a response to the res.
  res.on('ready', () => {
    ctx.log.info(`REQUIRE ${controller.name} ${res.httpStatusCode} ${res.toShortText()}`)

    if (res.error) {
      ctx.log.error(res.error)
    }
  })
  
  req.body = payload.body || null
  req.url = new URL(`https://127.0.0.1:${ctx.config.get('port')}`)
  req.ip = '127.0.0.1'
  req.ua = ctx.config.get('name') + '/' + ctx.config.get('version') + ' Node.js/' + process.versions.node
  req.authstr = settings.authstr
  req.controller = controller
  req.pathParams = payload.pathParams || {}
  req.searchParams = payload.searchParams || {}

  try {
    await runController(ctx, req, res, controller)
  } catch (e) {
    return res.internalError(e)
  }

  return res.data
}