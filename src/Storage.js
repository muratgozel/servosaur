import {sql, NotFoundError, DataIntegrityError} from 'slonik'
import pgformat from 'pg-format'

export default class Storage {
  constructor(name, schema, servosaur) {
    this.name = name
    this.schema = schema
    this.pgpool = servosaur.ctx.pgpool
    this.pgconn = servosaur.pgconn || null

    this.fields = []
    this.slonikPrimitiveTypes = {}

    this.configure()
  }

  configure() {
    const slonikPrimitiveTypeMap = {
      'boolean': 'bool',
      'number': 'int4',
      'string': 'text',
      'object': 'jsonb'
    }
    const obj = this.schema.describe().keys

    this.fields = Object.keys(obj)
    this.slonikPrimitiveTypes = Object
      .keys(obj)
      .reduce((memo, prop) => {
        memo[prop] = obj[prop].metas?.[0].slonikPrimitiveType 
          || slonikPrimitiveTypeMap[obj[prop].type] 
          || 'text'
        return memo
      }, {})
  }

  async reserveId(col='id') {
    const tableToken = sql.literalValue(this.name)
    const fieldToken = sql.literalValue(col)
    const query = sql`select nextval(pg_get_serial_sequence(${tableToken}, ${fieldToken})) as new_id`
    const result = await this.pgpool.query(query)
    return result.rows[0].new_id
  }

  async exists(filter) {
    const tableToken = sql.identifier([this.name])
    const filterToken = this.createFilterToken(filter)
    const query = sql`
      select id 
      from ${tableToken} 
      where ${filterToken}
    `
    return await this.pgpool.exists(query)
  }

  async one(filter) {
    const tableToken = sql.identifier([this.name])
    const filterToken = this.createFilterToken(filter)
    const query = sql`
      select * 
      from ${tableToken} 
      where ${filterToken}
    `

    try {
      return await this.pgconn.one(query)
    } catch (e) {
      if (e instanceof NotFoundError) {
        return new Error('RECORD_NOT_FOUND', {cause: e})
      }

      if (e instanceof DataIntegrityError) {
        return new Error('INTEGRITY_ERROR', {cause: e})
      }

      throw e
    }
  }

  async many(filter) {
    const tableToken = sql.identifier([this.name])
    const filterToken = this.createFilterToken(filter)
    const query = sql`
      select * 
      from ${tableToken} 
      where ${filterToken}
    `
    return await this.pgconn.any(query)
  }

  async create(_entity) {
    const entities = Array.isArray(_entity) ? _entity : [_entity]
    const entity = entities[0]
    const tableToken = sql.identifier([this.name])
    const fieldsToken = this.createFieldsToken(entity)
    const slonikPrimitiveTypes = this.getFieldsSlonikPrimitiveTypes(entity)
    const rows = this.createInsertionRows(entities)
    const unnestToken = sql.unnest(rows, slonikPrimitiveTypes)
    const query = sql`
      insert into ${tableToken} (${fieldsToken})
      select * from ${unnestToken}
    `
    return await this.pgconn.query(query)
  }

  async update(payload, filter) {
    const tableToken = sql.identifier([this.name])
    const filterToken = this.createFilterToken(filter)
    const updatesToken = this.createUpdatesToken(payload)
    const query = sql`
      update ${tableToken}
      set ${updatesToken}
      where ${filterToken}
    `
    return await this.pgconn.query(query)
  }

  async delete(filter) {
    const tableToken = sql.identifier([this.name])
    const filterToken = this.createFilterToken(filter)
    const query = sql`
      delete from ${tableToken} 
      where ${filterToken}
    `
    return await this.pgconn.query(query)
  }

  createFilterToken(obj=null, op='AND') {
    if (!obj) {
      return sql`1 > 0`
    }

    const tokens = []

    for (const prop in obj) {
      const field = prop.split('.').reverse()[0]
      if (this.fields.indexOf(field) === -1) continue;
      const fieldToken = sql.identifier([field])
      const slonikPrimitiveType = this.slonikPrimitiveTypes[field]

      const token = 
        slonikPrimitiveType == 'text[]'   ? sql`${obj[prop]} = ANY (${field})` :
        Array.isArray(obj[prop])          ? sql`${fieldToken} in (${sql.join(obj[prop], sql`, `)})` : 
        obj[prop] == '$IS_NOT_NULL'       ? sql`${fieldToken} IS NOT NULL` :
        sql`${fieldToken}=${obj[prop]}`

      tokens.push(token)
    }

    if (tokens.length === 0) {
      return sql`1 > 0`
    }

    return sql.join(tokens, sql` ${op} `)
  }

  mergeFilterTokens(tokens, op='AND') {
    return sql.join(tokens, sql` ${op} `)
  }

  createInsertionRows(entities) {
    const fields = this.getFields(entities[0])
    const rows = []

    for (const entity of entities) {
      const row = []
      for (const field of fields) {
        row.push( this.serializeFieldValue(entity[field], this.slonikPrimitiveTypes[field]) )
      }
      
      rows.push(row)
    }

    return rows
  }

  createUpdatesToken(obj) {
    const tokens = Object
      .keys(obj)
      .filter(field => this.fields.indexOf(field) !== -1)
      .map(field => {
        const fieldToken = sql.identifier([field])
        const serialized = this.serializeFieldValue(obj[field], this.slonikPrimitiveTypes[field])
        return sql`${fieldToken}=${serialized}`
      })

    return sql.join(tokens, sql`, `)
  }

  createFieldsToken(entity) {
    const fields = this.getFields(entity).map(f => sql.identifier([f]))
    return sql.join(fields, sql`, `)
  }

  getFieldsSlonikPrimitiveTypes(entity) {
    return this.getFields().map(f => this.slonikPrimitiveTypes[f])
  }

  getFields(entity) {
    return this.fields.filter(f => entity.hasOwnProperty(f))
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