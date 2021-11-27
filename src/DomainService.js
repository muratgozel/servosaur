export default class DomainService {
  constructor(schema, servosaur, Entity, Storage) {
    this.schema = schema
    this.ctx = servosaur.ctx
    this.req = servosaur.req
    this.res = servosaur.res
    this.entity = Entity
    this.storage = new Storage(servosaur)
  }

  async getOne(filter) {
    const row = await this.storage.one(filter)
    return new this.entity(row)
  }

  async get(filter) {
    const rows = await this.storage.many(filter)
    return rows.map(row => new this.entity(row))
  }

  async exists(filter) {
    return await this.storage.exists(filter)
  }

  async update(payload, filter) {
    return await this.storage.update(payload, filter)
  }
}