import EventEmitter from 'events'
import {
  UnprocessableEntity, BadRequest, NotFound, NotAuthenticated, NotAuthorized,
  PayloadTooLarge, UnsupportedMediaType, InternalServerError, ServosaurError
} from './errors.js'

export default class ResponseContext extends EventEmitter {
  constructor() {
    super()

    this.data = null
    this.httpHeaders = {}
    this.httpStatusCode = 0
    this._error = null
  }

  error(e, httpHeaders={}) {
    this.httpStatusCode = 500

    if (!(e instanceof ServosaurError)) {
      this._error = e
      this.data = {error: {code: 'UNEXPECTED_ERROR'}}
    }
    else {
      this.data = {error: {code: e.message}}
  
      if (e.details) this.data.error.details = e.details  

      if (e instanceof UnprocessableEntity ) this.httpStatusCode = 422
      if (e instanceof BadRequest ) this.httpStatusCode = 400
      if (e instanceof NotFound ) this.httpStatusCode = 404
      if (e instanceof NotAuthenticated ) this.httpStatusCode = 401
      if (e instanceof NotAuthorized ) this.httpStatusCode = 403
      if (e instanceof PayloadTooLarge ) this.httpStatusCode = 413
      if (e instanceof UnsupportedMediaType ) this.httpStatusCode = 415
      if (e instanceof InternalServerError) this.httpStatusCode = 500
    }

    this.httpHeaders = Object.assign({}, this.httpHeaders, httpHeaders || {})

    this.setContentType()
    this.emit('ready')
  }

  empty(httpHeaders={}) {
    this.data = null
    this.httpStatusCode = 204
    this.httpHeaders = Object.assign({}, this.httpHeaders, httpHeaders || {})
    this.setContentType()
    this.emit('ready')
  }

  created(data, httpHeaders={}) {
    this.data = data
    this.httpStatusCode = 201
    this.httpHeaders = Object.assign({}, this.httpHeaders, httpHeaders || {})
    this.setContentType()
    this.emit('ready')
  }

  json(obj, httpHeaders={}) {
    this.data = obj
    this.httpStatusCode = 200
    this.httpHeaders = Object.assign({}, this.httpHeaders, httpHeaders || {})
    this.setContentType()
    this.emit('ready')
  }

  markedForDeletion(httpHeaders={}) {
    this.data = null
    this.httpStatusCode = 202
    this.httpHeaders = Object.assign({}, this.httpHeaders, httpHeaders || {})
    this.setContentType()
    this.emit('ready')
  }

  toShortText() {
    const str = this.serialize(this.data)
    const len = str.length
    return str.slice(0, 40) + (len > 40 ? '...' : '')
  }

  setContentType() {
    if (this.isObject(this.data) || Array.isArray(this.data)) {
      this.httpHeaders['Content-Type'] = 'application/json'
    }
    else {
      this.httpHeaders['Content-Type'] = 'text/plain'
    }
  }

  serialize(data) {
    if (this.isObject(data) || Array.isArray(data)) {
      return JSON.stringify(data)
    }
    else {
      return data.toString()
    }
  }

  isObject(v) {
    return Object.prototype.toString.call(v) == '[object Object]'
  }
}
