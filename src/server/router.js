import pathre from 'path-to-regexp'

class Route {
  constructor(expression, method, controller) {
    this.expression = expression
    this.method = method.toUpperCase()
    this.controller = controller

    this.configure()
  }

  configure() {
    this.match = pathre.match(this.expression, {decode: decodeURIComponent})
    this.depth = pathre.pathToRegexp(this.expression).length
  }
}

class Router {
  constructor() {
    this.routes = []
  }

  match(path, method) {
    for (const r of this.routes) {
      const matchedRoute = r.match(path)

      if (matchedRoute && r.method == method) {
        return {
          path,
          controller: r.controller,
          pathParams: matchedRoute.params || {}
        }
      }
    }

    throw new Error('ENDPOINT_NOT_FOUND')
  }

  addRoute(r) {
    this.routes.push(r)
    this.sortRoutesByDepth()
  }

  sortRoutesByDepth() {
    this.routes.sort(function(a, b) {
      if (a.depth > b.depth) return -1
      else if (a.depth < b.depth) return 1
      else return 0
    })
  }
}

export const router = new Router()

export function route(expression, method, controller) {
  router.addRoute( new Route(expression, method, controller) )
}
