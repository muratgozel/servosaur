export default class RequestContext {
  constructor() {
    this._body = null
    this._url = null
    this._ip = null
    this._ua = null
    this._path = null
    this._controller = null
    this._pathParams = null
    this._searchParams = null
    this._authstr = null
    this._role = null
    this._filter = null
    this._payload = null
    this._method = null
    this._headers = null
  }

  set body(v) {this._body = v}
  get body() {return this._body}

  set url(v) {this._url = v}
  get url() {return this._url}

  set ip(v) {this._ip = v}
  get ip() {return this._ip}

  set ua(v) {this._ua = v}
  get ua() {return this._ua}

  set authstr(v) {this._authstr = v}
  get authstr() {return this._authstr}

  set searchParams(v) {this._searchParams = v}
  get searchParams() {return this._searchParams}

  set path(v) {this._path = v}
  get path() {return this._path}

  set controller(v) {this._controller = v}
  get controller() {return this._controller}

  set pathParams(v) {this._pathParams = v}
  get pathParams() {return this._pathParams}

  set role(v) {this._role = v}
  get role() {return this._role}

  set filter(v) {this._filter = v}
  get filter() {return this._filter}

  set payload(v) {this._payload = v}
  get payload() {return this._payload}

  set method(v) {this._method = v}
  get method() {return this._method}

  set headers(v) {this._headers = v}
  get headers() {return this._headers}

  isObject(v) {
    return Object.prototype.toString.call(v) == '[object Object]'
  }
}
