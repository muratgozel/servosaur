import joi from './src/modules/joi/index.js'

class Entity {
  #schema = null
  #fields = null
  #slonikPrimitiveTypes = {}

  constructor(payload, schema) {
    Object.assign(this, payload)

    this.configure(schema)
    this.validate()
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

  validate() {
    this.#schema.validateAsync(this)
  }

  excludeInRepresentation() {
    return []
  }

  configure(schema) {
    const slonikPrimitiveTypeMap = {
      'boolean': 'bool',
      'number': 'int4',
      'string': 'text',
      'object': 'jsonb'
    }
    const obj = schema.describe().keys

    this.#schema = schema
    this.#fields = Object.keys(obj)
    this.#slonikPrimitiveTypes = Object
      .keys(obj)
      .reduce((memo, prop) => {
        memo[prop] = obj[prop].metas?.[0].slonikPrimitiveType 
          || slonikPrimitiveTypeMap[obj[prop].type] 
          || 'text'
        return memo
      }, {})
  }
}

const schema = joi.object({
  name: joi.string(),
  id: joi.number()
})
const abc = new Entity({name: 'asdad', id: 900}, schema)
console.log(abc.hasOwnProperty('name'), abc.hasOwnProperty('configure'))