export default class Entity {
  #schema = null

  constructor(payload, schema) {
    Object.assign(this, payload)

    this.#schema = schema

    this.validate(payload)
  }

  represent() {
    const excluded = this.excludeInRepresentation()

    return Object
      .keys(this)
      .filter(prop => excluded.indexOf(prop) === -1)
      .reduce((memo, prop) => {
        memo[prop] = this[prop]
        return memo
      }, {})
  }

  validate(payload) {
    this.#schema.validateAsync(payload)
  }

  excludeInRepresentation() {
    return []
  }
}
