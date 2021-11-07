class Middlewares {
  constructor() {
    this._middlewares = []
  }

  add(name, fn) {
    this._middlewares.push({name, fn})
  }

  async run(self) {
    if (Object.keys(this._middlewares).length === 0) {
      return self
    }

    let name = null
    const jobs = this._middlewares.map(obj => {
      name = obj.name
      return obj.fn.apply(self)
    })
    for await (const result of jobs) {
      self[name] = result
    }

    return self
  }
}

export const middlewares = new Middlewares()

export function middleware(name, fn) {
  return middlewares.add(name, fn)
}
