import { regexpToFunction } from "path-to-regexp"

class Middlewares {
  constructor() {
    this._middlewares = []
  }

  add(name, fn) {
    this._middlewares.push({name, fn})
  }

  async run(self) {
    const results = {}

    if (Object.keys(this._middlewares).length === 0) {
      return results
    }

    let name = null
    const jobs = this._middlewares.map(obj => {
      name = obj.name
      return obj.fn.apply(self)
    })
    for await (const result of jobs) {
      results[name] = result
    }

    return results
  }
}

export const middlewares = new Middlewares()

export function middleware(name, fn) {
  return middlewares.add(name, fn)
}
