import {sql, NotFoundError, DataIntegrityError} from 'slonik'
import pgformat from 'pg-format'

export default class Storage {
  constructor(ctx, factories) {
    this.ctx = ctx
    this.factories = factories

    this.pgconn = null
    this.pgpool = null
    this.results = []
  }

  async process(instructions) {
    if (!this.ctx.pgpool) {
      throw new Error('NO_CONNECTION')
    }

    return await this.ctx.pgpool.connect(async (pgconn) => {
      this.pgpool = this.ctx.pgpool
      this.pgconn = pgconn

      await this._process(instructions)

      return this.results
    })
  }

  async _process(instructions, ind=0) {
    if (!instructions[ind]) {
      return;
    }

    const {instruction, payload=undefined, filter=undefined} = instructions[ind]
    const [action, factoryName] = instruction.split(' ')
    const factory = this.factories.filter(f => f.getName() == factoryName)[0]

    if      (action == 'create')  await this.create(factory, payload)
    else if (action == 'update')  await this.update(factory, payload, filter)
    else if (action == 'delete')  await this.delete(factory, filter)
    else if (action == 'one')     await this.one(factory, filter)
    else if (action == 'many')    await this.many(factory, filter)
    else {}

    ind += 1

    return await this._process(instructions, ind)
  }

  async exists(factory, filter) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('root')
    const filterToken = this.createFilterToken(description, filter)
    const query = sql`select id from ${tableToken} ${filterToken} limit 1`

    try {
      return await this.pgpool.exists(query)
    } catch (e) {
      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  async many(factory, filter) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('root')
    const filterToken = this.createFilterToken(description, filter)
    const query = sql`select * from ${tableToken} ${filterToken}`

    try {
      return await this.pgconn.any(query)
    } catch (e) {
      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  async one(factory, filter) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('root')
    const filterToken = this.createFilterToken(description, filter)
    const query = sql`select * from ${tableToken} ${filterToken}`

    try {
      return await this.pgconn.one(query)
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new Error('DATA_NOT_FOUND', {cause: e})
      }

      if (e instanceof DataIntegrityError) {
        throw new Error('DATA_INTEGRITY_ERROR', {cause: e})
      }

      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  async delete(factory, filter) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('root')
    const filterToken = this.createFilterToken(description, filter)
    const query = sql`delete from ${tableToken} ${filterToken}`

    try {
      const result = await this.pgconn.query(query)

      return {
        rowCount: result.rowCount
      }
    } catch (e) {
      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  async update(factory, payload, filter) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('update')
    const fieldsToken = this.createFieldsToken(description)
    const updatesToken = this.createUpdatesToken(description, payload)
    const filterToken = this.createFilterToken(description, filter)
    const query = sql`
      update ${tableToken}
      set ${updatesToken}
      ${filterToken}
      returning *
    `

    try {
      const result = await this.pgconn.query(query)
      const entities = factory.createEntities(result.rows)

      entities.map((entity) => this.results.unshift({
        action: 'updated', entity: entity, factory: factory
      }))

      return entities
    } catch (e) {
      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  async create(factory, payload) {
    const tableToken = sql.identifier([factory.getName()])
    const description = factory.getDescription('create')
    const fieldsToken = this.createFieldsToken(description)
    const slonikPrimitiveTypes = this.getPrimitiveTypes(description)
    const rows = this.createRows(description, payload)
    const unnestToken = sql.unnest(rows, slonikPrimitiveTypes)
    const query = sql`
      insert into ${tableToken} (${fieldsToken})
      select * from ${unnestToken}
      returning *;
    `

    try {
      const result = await this.pgconn.query(query)
      const entities = factory.createEntities(result.rows)

      entities.map((entity) => this.results.unshift({
        action: 'created', entity: entity, factory: factory
      }))

      return entities
    } catch (e) {
      throw new Error('FAILED_QUERY', {cause: e})
    }
  }

  createFilterToken(description, obj=null) {
    if (!obj) {
      return ''
    }

    const tokens = []

    for (const prop in obj) {
      const matches = description.filter(o => o.name == prop)

      if (matches && matches.length > 0) {
        const type = matches[0].slonikPrimitiveType
        const field = sql.identifier(matches[0].dbField.split('.'))

        if (Array.isArray(obj[prop])) {
          tokens.push( sql`${field} in (${sql.join(obj[prop], sql`, `)})` )
        }
        else {
          tokens.push( sql`${field}=${obj[prop]}` )
        }
      }
    }

    if (!tokens.length === 0) {
      return ''
    }

    return sql.join(tokens, sql` AND `)
  }

  createUpdatesToken(description, payload) {
    const tokens = []

    for (const o of description) {
      const field = sql.identifier(o.dbField.split('.'))
      const v = payload.hasOwnProperty(o.name) ? payload[o.name] : null
      const serialized = this.serializeFieldValue(v, o.slonikPrimitiveType)

      tokens.push(sql`${field}=${serialized}`)
    }

    return sql.join(tokens, sql`, `)
  }

  createRows(description, arr) {
    const rows = []

    for (const payload of arr) {
      const row = []

      for (const o of description) {
        const v = payload.hasOwnProperty(o.name) ? payload[o.name]
          : o.foreignKey ? this.findForeignKeyInResults(o.foreignKey)
          : null
        const serialized = this.serializeFieldValue(v, o.slonikPrimitiveType)

        row.push(v)
      }

      rows.push(row)
    }

    return rows
  }

  findForeignKeyInResults(foreignKey) {
    const [foreignTable, foreignColumn] = foreignKey.split('.')

    if (this.results.length === 0) {
      return null
    }

    for (const obj of this.results) {
      if (obj.action == 'created' && obj.factory.getName() == foreignTable) {
        return obj.entity[foreignColumn]
      }
    }

    return null
  }

  createFieldsToken(description) {
    const identifiers = []

    for (const o of description) {
      identifiers.push( sql.identifier([o.dbField]) )
    }

    return sql.join(identifiers, sql`, `)
  }

  getPrimitiveTypes(description) {
    const types = []

    for (const o of description) {
      types.push( o.slonikPrimitiveType )
    }

    return types
  }

  serializeFieldValue(v, type) {
    if (type == 'jsonb' && this.isObject(v)) {
      return JSON.stringify(v)
    }

    if (['text[]', 'int[]'].indexOf(type) !== -1 && Array.isArray(v)) {
      return '{' + pgformat('%I', v) + '}'
    }

    return v
  }

  isObject(v) {
    return Object.prototype.toString.call(v) == '[object Object]'
  }
}
