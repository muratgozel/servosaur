import {URL} from 'url'
import qs from 'qs'
import proxyaddr from 'proxy-addr'
import * as errors from '../errors.js'
import runController from '../application/runController.js'
import RequestContext from '../RequestContext.js'
import ResponseContext from '../ResponseContext.js'
import { middlewares } from '../Middlewares.js'
import {router} from './router.js'
import parse from './bodyParser.js'

export default (ctx) => {
  return async (request, response) => {
    // create request and response contexes first
    // these are specific to the application and
    // independent from the server tool (koa, etc.)
    const req = new RequestContext()
    const res = new ResponseContext()

    // send the response whenever application sends a response to the res.
    res.on('ready', () => {
      ctx.log.info(`${request.method} ${request.url} ${res.httpStatusCode} ${res.toShortText()}`)

      if (res.error) {
        ctx.log.error(res.error)
      }

      response.writeHead(res.httpStatusCode, res.httpHeaders)
      response.write(res.serialize(res.data))
      response.end()
    })

    // parse request body
    try {
      req.body = await parse(request, res)
    } catch (e) {
      return res.error(e)
    }

    req.url = new URL(`https://${request.headers.host}${request.url}`)
    req.ip = proxyaddr.all(request)[0]
    req.ua = request.headers['user-agent']
    req.authstr = request.headers.authorization || null

    // route
    try {
      const {path, controller, pathParams, method} = router.match(request.url, request.method)

      req.method = method
      req.path = path
      req.controller = controller
      req.pathParams = pathParams
      req.searchParams = req.url.search ? qs.parse(req.url.search) : {}
    } catch (e) {
      return res.error(e)
    }

    try {
      return await runController(ctx, req, res, req.controller)
    } catch (e) {
      return res.error(e)
    }
  }
}
