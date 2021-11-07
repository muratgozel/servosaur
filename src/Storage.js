import {sql, NotFoundError, DataIntegrityError} from 'slonik'
import pgformat from 'pg-format'

export default class Storage {
  constructor(name, descriptions, servosaur) {
    this.name = name
    this.descriptions = descriptions
    this.pgpool = servosaur.ctx.pgpool
    this.pgconn = servosaur.pgconn || null
  }

  async reserveId(col='id') {
    const tableToken = sql.identifier([this.name])
    const fieldToken = sql.identifier([col])
    const query = sql`select nextval(${sql.identifier([this.name + '_' + col + '_seq'])}) as new_id`
    const result = await this.pgpool.query(query)
    console.log('result:', result)
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
        throw new Error('DATA_NOT_FOUND', {cause: e})
      }

      if (e instanceof DataIntegrityError) {
        throw new Error('DATA_INTEGRITY_ERROR', {cause: e})
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

  async create(entity) {
    const tableToken = sql.identifier([this.name])
    const fieldsToken = this.createFieldsToken()
    const slonikPrimitiveTypes = this.getPrimitiveTypes()
    const rows = this.createInsertionRows([entity])
    const unnestToken = sql.unnest(rows, slonikPrimitiveTypes)
    const query = sql`
      insert into ${tableToken} (${fieldsToken})
      select * from ${unnestToken}
    `
    return await this.pgconn.query(query)
  }

  async update(payload, filter) {
    const tableToken = sql.identifier([this.name])
    const fieldsToken = this.createFieldsToken()
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

  createFilterToken(obj=null) {
    if (!obj) {
      return sql`1 > 0`
    }

    const tokens = []

    for (const prop in obj) {
      const description = this.getDescription(prop)
      const field = sql.identifier([description.dbField])

      if (Array.isArray(obj[prop])) {
        tokens.push( sql`${field} in (${sql.join(obj[prop], sql`, `)})` )
      }
      else {
        tokens.push( sql`${field}=${obj[prop]}` )
      }
    }

    if (tokens.length === 0) {
      return sql`1 > 0`
    }

    return sql.join(tokens, sql` AND `)
  }

  createInsertionRows(entities) {
    const rows = []

    for (const entity of entities) {
      const row = []

      for (const param of entity.getParams()) {
        const description = this.getDescription(param)
        const v = entity.hasOwnProperty(param) ? entity[param] : null
        const serialized = this.serializeFieldValue(v, description.slonikPrimitiveType)
        
        row.push(serialized)
      }
      
      rows.push(row)
    }

    return rows
  }

  createUpdatesToken(payload) {
    const tokens = []

    for (const param in payload) {
      const description = this.getDescription(param)
      const v = payload[param]
      const serialized = this.serializeFieldValue(v, description.slonikPrimitiveType)
      
      tokens.push(sql`${sql.identifier([description.dbField])}=${serialized}`)
    }

    return sql.join(tokens, sql`, `)
  }

  createFieldsToken(schema='root') {
    const identifiers = []

    for (const o of this.descriptions[schema]) {
      identifiers.push( sql.identifier([o.dbField]) )
    }

    return sql.join(identifiers, sql`, `)
  }

  getPrimitiveTypes(schema='root') {
    const types = []

    for (const o of this.descriptions[schema]) {
      types.push( o.slonikPrimitiveType )
    }

    return types
  }

  getDescription(prop, schema='root') {
    prop = prop.split('.').reverse()[0]
    const arr = this.descriptions[schema].filter(o => o.dbField == prop)

    if (Array.isArray(arr) && arr.length > 0) {
      return arr[0]
    }

    throw new Error('PROP_DESCRIPTION_NOT_FOUND', {
      cause: new Error(`"${prop}" not found in "${this.name}"'s ${schema} description.`)
    })
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