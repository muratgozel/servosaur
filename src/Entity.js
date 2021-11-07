export default class Entity {
  #params = []
  #hideParams = []

  constructor(payload, params, hideParams) {
    this.#params = params
    this.#hideParams = hideParams
    this.setParams(payload)
  }

  setParams(payload) {
    this.#params.map(
      p => payload.hasOwnProperty(p) ? this[p] = payload[p] : null
    )
  }

  getParams() {
    return this.#params
  }

  represent() {
    return this.#params.reduce((memo, p) => {
      if (this.#hideParams.indexOf(p) === -1) {
        memo[p] = this[p]
      }
      return memo
    }, {})
  }
}
