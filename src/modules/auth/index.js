import crypto from 'crypto'
import {jwtDecrypt, EncryptJWT, errors} from 'jose'

export default class Auth {
  constructor() {
    this.hmacAlgorithm = 'sha256'
    this.supportedAuthorizationSchemes = ['Bearer', 'Basic']
    this.reAuthHeader = new RegExp('(Bearer|Basic)\\s([0-9a-zA-Z_.\\-+/=]+)')
    this.jwtProtectedHeader = { alg: 'dir', enc: 'A256GCM' }
  }

  static generateRandomNumber(len=6) {
    return crypto.randomInt(Math.pow(10, len-1), Math.pow(10, len) - 1)
  }

  static generateRandomStr(len=16) {
    return randomBytes(len/2).toString('hex')
  }

  createMac(data, secret) {
    return crypto.createHmac(this.hmacAlgorithm, secret).update(data).digest('hex')
  }

  parseAuthorizationHeader(value) {
    const result = {scheme: null}

    if (!value || (value && value.indexOf(' ') === -1)) {
      result.error = new Error('MISSING_AUTH_STRING')
      return result
    }

    let scheme=null, credentials=null, rest=null
    try {
      const [, scheme, credentials, ...rest] = value.match(re)

      if (this.supportedAuthorizationSchemes.indexOf(scheme) === -1) {
        result.error = new Error('UNSUPPORTED_AUTH_SCHEME')
        return result
      }
    } catch (e) {
      result.error = new Error('INVALID_AUTH_STRING')
      return result
    }

    result.scheme = scheme

    if (result.scheme == 'Bearer') {
      // this is a jwt token probably, will explore it later
      result.token = result.credentials
    }

    if (result.scheme == 'Basic') {
      // this is a client id and encrypted secret (aka username and encrypted password)
      let clientId=null, clientSecret=null
      try {
        [clientId, clientSecret] = Buffer.from(result.token, 'base64').toString().split(':')
      } catch (e) {
        result.error = new Error('INVALID_AUTH_STRING')
        return result
      }

      result.clientId = clientId
      result.clientSecret = clientSecret
    }

    return result
  }

  async generateEncryptedJwtToken(secret, claims, payload) {
    if (typeof secret == 'string') {
      secret = crypto.createSecretKey(
        crypto.createHash('sha256').update(secret).digest()
      )
    }

    const jwtins = new EncryptJWT(payload)
    jwtins.setProtectedHeader(this.jwtProtectedHeader)
    jwtins.setIssuedAt()

    if (claims.iss) jwtins.setIssuer(claims.iss)
    if (claims.aud) jwtins.setAudience(claims.aud)
    if (claims.sub) jwtins.setSubject(claims.sub)
    if (claims.exp) jwtins.setExpirationTime(claims.exp)
    if (claims.jti) jwtins.setJti(claims.jti)

    return await jwtins.encrypt(secret)
  }

  async verifyEncryptedJwtToken(jwt, secret, claims={}) {
    if (typeof secret == 'string') {
      secret = crypto.createSecretKey(
        crypto.createHash('sha256').update(secret).digest()
      )
    }

    const _claims = {}
    if (claims.iss) _claims.issuer = claims.iss
    if (claims.aud) _claims.audience = claims.aud
    if (claims.sub) _claims.subject = claims.sub

    let payload=null, protectedHeader=null
    try {
      ({payload, protectedHeader} = await jwtDecrypt(jwt, secret, _claims))
    } catch (e) {
      if (e instanceof errors.JWTClaimValidationFailed) {
        throw new Error('INVALID', {cause: e})
      }
      else if (e instanceof errors.JWTExpired) {
        throw new Error('EXPIRED', {cause: e})
      }
      else {
        throw e
      }
    }

    return payload
  }
}
