import {entityFactoryManager} from './EntityFactoryManager.js'

export default class ApplicationContext {
  constructor() {
    this._config = null
    this._log = null
    this._rbac = null
    this._joi = null
    this._auth = null
    this._dayjs = null
    this._pgpool = null
    this._redis = null
    this._bree = null
    this._memory = {}
    this._entityFactoryManager = entityFactoryManager
  }

  set config(v) {this._config = v}
  get config() {return this._config}

  set log(v) {this._log = v}
  get log() {return this._log}

  set rbac(v) {this._rbac = v}
  get rbac() {return this._rbac}

  set joi(v) {this._joi = v}
  get joi() {return this._joi}

  set auth(v) {this._auth = v}
  get auth() {return this._auth}

  set dayjs(v) {this._dayjs = v}
  get dayjs() {return this._dayjs}

  set pgpool(v) {this._pgpool = v}
  get pgpool() {return this._pgpool}

  set redis(v) {this._redis = v}
  get redis() {return this._redis}

  set bree(v) {this._bree = v}
  get bree() {return this._bree}

  set memory(v) {this._memory = v}
  get memory() {return this._memory}

  get entityFactoryManager() {return this._entityFactoryManager}
}
