import pathre from 'path-to-regexp'
import {NotFound, MethodNotAllowed} from '../errors.js'

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
    let pathMatchesButMethod = false

    for (const r of this.routes) {
      const matchedRoute = r.match(path)

      if (matchedRoute && r.method != method) {
        pathMatchesButMethod = true
      }

      if (matchedRoute && r.method == method) {
        return {
          method: r.method,
          path,
          controller: r.controller,
          pathParams: matchedRoute.params || {}
        }
      }
    }

    if (pathMatchesButMethod) {
      throw new MethodNotAllowed('INVALID_HTTP_METHOD', {context: {path: path}})
    }

    throw new NotFound('ENDPOINT_NOT_FOUND', {context: {path: path}})
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
