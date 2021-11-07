import http from 'http'
import fs from 'fs'
import convict from 'convict'
import {RBAC} from 'rbac'
import Bree from 'bree'
import joi from './modules/joi/index.js'
import {configure as configureLogging} from './modules/logging/index.js'
import Auth from './modules/auth/index.js'
import dayjs from './modules/dayjs/index.js'
import Device from './modules/device/index.js'
import * as pow from './modules/pow/index.js'
import createDatabaseConnection from './application/createDatabaseConnection.js'
import createRedisConnection from './application/createRedisConnection.js'
import ApplicationContext from './ApplicationContext.js'
import {default as serverHandler} from './server/handler.js'
import {default as requireHandler} from './require/handler.js'

export {default as joi} from './modules/joi/index.js'
export {default as dayjs} from './modules/dayjs/index.js'
export {sql} from 'slonik'
export * as util from './Util.js'
export {route} from './server/router.js'
export {middleware} from './Middlewares.js'
export {default as Domain} from './Domain.js'
export {default as Entity} from './Entity.js'
export {default as Storage} from './Storage.js'

export class Servosaur {
  constructor() {
    this.ctx = null
    this.server = null
  }

  async createContext(configSchema, rbacSchema=null, jobs=[]) {
    const ctx = new ApplicationContext()

    ctx.config = convict(configSchema)
    ctx.config.validate({allowed: 'strict'})
    ctx.version = ctx.config.get('version')

    ctx.rbac = rbacSchema ? await (new RBAC(rbacSchema)).init() : null
    ctx.joi = joi
    ctx.log = configureLogging(ctx.config)

    ctx.auth = new Auth()
    ctx.dayjs = dayjs
    ctx.device = new Device({
      maxmindAccountId: ctx.config.get('maxmindAccountId'),
      maxmindLicenseKey: ctx.config.get('maxmindLicenseKey')
    })
    ctx.pow = pow

    const connstr = ctx.config.get('pgConnStr')
    ctx.pgpool = connstr ? await createDatabaseConnection(ctx.config, ctx.log) : null

    const redisconnstr = ctx.config.get('redisConnStr')
    ctx.redis = redisconnstr ? await createRedisConnection(ctx.config, ctx.log) : null

    const breeopts = {
      closeWorkerAfterMs: 10000,
      worker: {env: process.env},
      logger: ctx.log,
      jobs: jobs,
      errorHandler: (err, meta) => {
        ctx.log.error(err, `Worket thread (${meta.name || ''}) raised an exception.`)
      }
    }
    ctx.bree = jobs.length > 0 ? new Bree(breeopts) : null

    process.on('uncaughtException', (err, origin) => {
      ctx.log.error(err, 'Uncaught exception.')
      process.exitCode = 1
    })

    this.ctx = ctx
  
    return this.ctx
  }

  async start() {
    return new Promise((resolve, reject) => {
      if (this.ctx.bree) this.ctx.bree.start()

      this.server = http.createServer( serverHandler(this.ctx) )

      this.server.on('clientError', (error, socket) => {
        if (err.code === 'ECONNRESET' || !socket.writable) {
          return;
        }

        this.ctx.log.error(error, 'Server client error.')

        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      })

      this.server.listen(this.ctx.config.get('port'), '0.0.0.0', () => {
        this.ctx.log.info(`${this.ctx.config.get('name')} server is online.`)
        return resolve(this.server)
      })
    })
  }

  async callMethod(controller, payload, settings={}) {
    return await requireHandler(this.ctx, controller, payload, settings)
  }
}