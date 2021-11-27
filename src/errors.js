export class ServosaurError extends Error {
  constructor(msg, payload) {
    super(msg)

    this.name = this.constructor.name

    Error.captureStackTrace(this, this.constructor)

    if (payload.cause && payload.cause instanceof Error) {
      this.cause = payload.cause
    }

    if (payload.msg) {
      this.details = payload.msg
    }

    if (payload.context) {
      this.context = payload.context
    }
  }
}

export class BadRequest extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class NotFound extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class UnprocessableEntity extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class NotAuthenticated extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class NotAuthorized extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class PayloadTooLarge extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class UnsupportedMediaType extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class MethodNotAllowed extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}

export class InternalServerError extends ServosaurError {
  constructor(msg, payload={}) {
    super(msg, payload)
  }
}
