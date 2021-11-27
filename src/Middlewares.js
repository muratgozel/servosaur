class Middlewares {
  constructor() {
    this._middlewares = []
  }

  add(fn) {
    this._middlewares.push(fn)
  }

  async run(self, middlewares=null) {
    if (middlewares === null) {
      return await this.run(self, [].concat(this._middlewares))
    }

    if (middlewares.length === 0) {
      return self
    }

    await middlewares[0].apply(self)

    middlewares.shift()

    return this.run(self, middlewares)
  }
}

export const middlewares = new Middlewares()

export function middleware(fn) {
  return middlewares.add(fn)
}
