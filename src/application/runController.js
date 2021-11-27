import {middlewares} from '../Middlewares.js'

export default async (ctx, req, res, controller) => {
  let thisctx = {ctx, req, res}
  try {
    thisctx = await middlewares.run(thisctx)
  } catch (e) {
    return res.error(e)
  }

  return await controller.apply(thisctx, [])
}