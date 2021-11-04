import {generateDescriptions} from './modules/joi/index.js'

export class EntityFactory {
  #name = null
  #schema = null
  #EntityObject = null
  #params = []

  constructor(name, Entity, schema) {
    this.#name = name
    this.#schema = schema
    this.#EntityObject = Entity

    this.identifyParams()
  }

  createEntity(data) {
    const entity = new this.#EntityObject(this)

    for (const param of this.#params) {
      entity[param] = data.hasOwnProperty(param) ? data[param] : null
    }

    return entity
  }

  createEntities(arr) {
    return arr.map(data => this.createEntity(data))
  }

  identifyParams() {
    this.getDescription('root').map(o => this.#params.push(o.name))
  }

  getName() {
    return this.#name
  }

  getSchema(name) {
    return this.#schema[name]
  }

  getDescription(schema) {
    return this.#schema.descriptions[schema]
  }
}

class EntityFactoryManager {
  constructor() {
    this.factories = []
  }

  createFactory(name, Entity, schema) {
    schema.descriptions = generateDescriptions(schema.root, schema.create, schema.update)

    const len = this.factories.push( new EntityFactory(name, Entity, schema) )

    return this.factories[len - 1]
  }

  getSchema(name) {
    for (const f of this.factories) {
      if (f.name == name) {
        return f.schema
      }
    }
    return undefined;
  }
}

export const entityFactoryManager = new EntityFactoryManager()

export function createFactory(name, Entity, schema) {
  entityFactoryManager.createFactory(name, Entity, schema)
}