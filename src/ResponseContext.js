import EventEmitter from 'events'

export default class ResponseContext extends EventEmitter {
  constructor() {
    super()

    this.data = null
    this.httpHeaders = {}
    this.httpStatusCode = 0
    this.error = null
  }

  aborted() {
    this.#createResponse({
      error,
      data: {error: {
        code: 'ABORTED'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 400
    })
  }

  payloadTooLarge() {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 413
    })
  }

  unsupportedEncoding() {
    this.#createResponse({
      error,
      data: {error: {
        code: 'BAD_REQUEST'
      }},
      httpHeaders: {'Content-Type': 'application/json'},
      httpStatusCode: 415
    })
  }

  unsupportedPayload() {
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
    const contentType = this.httpHeaders['Content-Type'] || 'text/plain'

    if (!this.data) return ''

    if (contentType == 'application/json' && this.isObject(this.data)) {
      return JSON.stringify(this.data).slice(0, 40)
    }

    return this.data.slice(0, 40)
  }

  #createResponse(cfg={}) {
    this.error = cfg.error || null
    this.data = cfg.data || ''
    this.httpHeaders = Object.assign({}, this.httpHeaders, cfg.httpHeaders || {})
    this.httpStatusCode = cfg.httpStatusCode

    if (this.httpHeaders['Content-Type'] == 'application/json' && this.isObject(this.data)) {
      this.data = JSON.stringify(this.data)
    }

    this.emit('ready')
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
