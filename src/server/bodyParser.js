import zlib from 'zlib'
import getRawBody from 'raw-body'
import typeis from 'type-is'
import qs from 'qs'
import * as errors from '../errors.js'

function decode(stream) {
  const encoding = (stream.headers['content-encoding'] || 'identity').toLowerCase()

  let newStream=null
  switch (encoding) {
    case 'deflate':
      newStream = zlib.createInflate()
      stream.pipe(newStream)
      break;

    case 'gzip':
      newStream = zlib.createGunzip()
      stream.pipe(newStream)
      break;

    case 'identity':
      newStream = stream
      stream.length = stream.headers['content-length']
      break;

    default:
      throw new Error(`Unsupported content encoding ${encoding}`)
  }

  return newStream
}

export default async function parse(request, res) {
  // check if stream has a body
  if (!typeis.hasBody(request)) {
    return null
  }

  // check encoding, decode if neccessary
  try {
    request = decode(request)
  } catch (e) {
    return res.error(new BadRequest('DECODING_FAILED', {cause: e}))
  }

  // read raw body as buffer
  let buf=null
  try {
    buf = await getRawBody(request)
  } catch (e) {
    if (e.type) {
      switch (e.type) {
        case 'encoding.unsupported':
          return res.error(new UnsupportedMediaType('UNSUPPORTED_ENCODING', {cause: e}))
          break;
        case 'entity.too.large':
          return res.error(new PayloadTooLarge('PAYLOAD_TOO_LARGE', {cause: e}))
          break;
        case 'request.aborted':
          return res.error(new BadRequest('ABORTED', {cause: e}))
          break;
        case 'request.size.invalid':
          return res.error(new BadRequest('REQUEST_SIZE_MISMATCH', {cause: e}))
          break;
        default:
          return res.error(new InternalServerError('COULDN\'T READ BODY', {cause: e}))
          break;
      }
    }
    return res.error(new InternalServerError('COULDN\'T READ BODY', {cause: e}))
  }

  // parse
  const str = buf.toString()
  const type = typeis(request, ['text', 'urlencoded', 'json', 'multipart'])
  switch (type) {
    case 'text':
      return str
      break;

    case 'urlencoded':
      return qs.parse(str)
      break;

    case 'json':
      return JSON.parse(str)
      break;

    case 'multipart':
      return res.error(new UnsupportedMediaType('UNSUPPORTED_CONTENT_TYPE', {cause: e}))
      break;

    default:
      return res.error(new UnsupportedMediaType('UNSUPPORTED_CONTENT_TYPE', {cause: e}))
  }
}
