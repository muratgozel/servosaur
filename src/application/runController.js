import {middlewares} from '../Middlewares.js'

export default async (ctx, req, res, controller) => {
  const thisctx = {
    ctx, req, res
  }
  const thisctx2 = await middlewares.run(thisctx)

  return await controller.apply(thisctx2, [])
}