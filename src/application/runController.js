import {middlewares} from '../Middlewares.js'

export default async (ctx, req, res, controller) => {
  const storage = new ctx.Storage(ctx, ctx.entityFactoryManager.factories)
  const thisctx = {
    ctx, req, res, storage,
    getSchema: name => ctx.entityFactoryManager.getSchema(name)
  }
  thisctx.middleware = await middlewares.run(thisctx)

  return await controller.apply(thisctx, [])
}