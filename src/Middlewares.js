class Middlewares {
  constructor() {
    this._middlewares = []
  }

  add(fn) {
    this._middlewares.push({fn})
  }

  async run(self) {
    if (Object.keys(this._middlewares).length === 0) {
      return self
    }

    const jobs = this._middlewares.map(obj => {
      return obj.fn.apply(self)
    })
    for await (const result of jobs) {
      // each middleware will assign whatever result they provide to self
    }

    return self
  }
}

export const middlewares = new Middlewares()

export function middleware(fn) {
  return middlewares.add(fn)
}
