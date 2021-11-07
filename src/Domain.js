export default class Domain {
  constructor(servosaur) {
    this.ctx = servosaur.ctx
    this.req = servosaur.req
    this.res = servosaur.res
  }

  static generateDescriptions(schemas) {
    const result = {}
    const slonikPrimitiveTypeMap = {
      'boolean': 'boolean',
      'number': 'int4',
      'string': 'text',
      'object': 'jsonb'
    }
    
    const rootObject = schemas.root.describe().keys
    const rootForbiddenKeys = Object.keys(rootObject).filter(
      k => rootObject[k].flags?.presence == 'forbidden'
    )
    result.root = Object
      .keys(rootObject)
      .filter(key => rootForbiddenKeys.indexOf(key) === -1)
      .map(key => {
        return {
          name: key,
          dbField: (rootObject[key].metas?.[0].dbField || key),
          slonikPrimitiveType: rootObject[key].metas?.[0].slonikPrimitiveType || slonikPrimitiveTypeMap[rootObject[key].type] || 'text'
        }
      })

    if (schemas.create) {
      const createObject = schemas.create.describe().keys
      const createForbiddenKeys = Object.keys(createObject).filter(
        k => createObject[k].flags?.presence == 'forbidden'
      )    
      result.create = Object
        .keys(createObject)
        .filter(key => createForbiddenKeys.indexOf(key) === -1)
        .map(key => {
          return {
            name: key,
            dbField: (rootObject[key].metas?.[0].dbField || key),
            slonikPrimitiveType: rootObject[key].metas?.[0].slonikPrimitiveType || slonikPrimitiveTypeMap[rootObject[key].type] || 'text'
          }
        })
    }

    if (schemas.update) {
      const updateObject = schemas.update.describe().keys
      const updateForbiddenKeys = Object.keys(updateObject).filter(
        k => updateObject[k].flags?.presence == 'forbidden'
      )
      result.update = Object
        .keys(updateObject)
        .filter(key => updateForbiddenKeys.indexOf(key) === -1)
        .map(key => {
          return {
            name: key,
            dbField: (rootObject[key].metas?.[0].dbField || key),
            slonikPrimitiveType: rootObject[key].metas?.[0].slonikPrimitiveType || slonikPrimitiveTypeMap[rootObject[key].type] || 'text'
          }
        })
    }

    return result
  }
}