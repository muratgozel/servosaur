import EventEmitter from 'events'

export default class ResponseContext extends EventEmitter {
  constructor() {
    super()

    this.data = null
    this.httpHeaders = {}
    this.httpStatusCode = 0
    this.error = null
  }

  invalidBody(code=null, error=undefined) {
    this.#createResponse({
      error,
      data: {error: {
        code: code || 'BODY_VALIDATION_ERROR'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 422
    })
  }

  aborted(error=undefined) {
    this.#createResponse({
      error,
      data: {error: {
        code: 'ABORTED'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 400
    })
  }

  payloadTooLarge(error=undefined) {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 413
    })
  }

  unsupportedEncoding(error=undefined) {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 415
    })
  }

  unsupportedPayload(error=undefined) {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 415
    })
  }

  badRequest(error, msg='') {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 400
    })
  }

  notFound() {
    this.#createResponse({
      data: {error: {
        code: 'NOT_FOUND'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 404
    })
  }

  internalError(error) {
    this.#createResponse({
      error,
      data: {error: {
        code: 'UNEXPECTED_ERROR'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 500
    })
  }

  json(obj, httpHeaders={}) {
    this.#createResponse({
      data: obj,
      httpHeaders: Object.assign({}, httpHeaders, {'Content-Type': 'application/json'}),
      httpStatusCode: 200
    })
  }

  created(data='', httpHeaders={}) {
    this.#setContentType(data)
    this.#createResponse({
      data: data,
      httpHeaders,
      httpStatusCode: 201
    })
  }

  updated(data='', httpHeaders={}) {
    this.#setContentType(data)
    this.#createResponse({
      data: data,
      httpHeaders,
      httpStatusCode: 200
    })
  }

  deleted() {
    this.#createResponse({httpStatusCode: 204})
  }

  toShortText() {
    let str = ''
    if (!this.data) return str

    if (this.isObject(this.data) || Array.isArray(this.data)) {
      str = JSON.stringify(this.data)
    }
    else {
      str = this.data
    }

    return str.slice(0, 40) + (str.length > 40 ? '...' : '')
  }

  #createResponse(cfg={}) {
    this.error = cfg.error || null
    this.data = cfg.data || ''
    this.httpHeaders = Object.assign({}, this.httpHeaders, cfg.httpHeaders || {})
    this.httpStatusCode = cfg.httpStatusCode

    this.emit('ready')
  }

  serialize(data) {
    if (this.isObject(data) || Array.isArray(data)) {
      return JSON.stringify(data)
    }
    else {
      return data
    }
  }

  #setContentType(data) {
    if (this.isObject(data)) {
      this.httpHeaders['Content-Type'] = 'application/json'
    }
    else {
      this.httpHeaders['Content-Type'] = 'text/plain'
    }
  }

  isObject(v) {
    return Object.prototype.toString.call(v) == '[object Object]'
  }
}
