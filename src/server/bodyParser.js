import zlib from 'zlib'
import getRawBody from 'raw-body'
import typeis from 'type-is'
import qs from 'qs'

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
    return res.badRequest(e)
  }

  // read raw body as buffer
  let buf=null
  try {
    buf = await getRawBody(request)
  } catch (e) {
    if (e.type) {
      switch (e.type) {
        case 'encoding.unsupported':
          return res.unsupportedEncoding()
          break;
        case 'entity.too.large':
          return res.payloadTooLarge()
          break;
        case 'request.aborted':
          return res.aborted()
          break;
        case 'request.size.invalid':
          return res.badRequest(e, 'Request size and content length didn\'t match.')
          break;
        default:
          return res.internalError(e)
          break;
      }
    }
    return res.internalError(e)
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
      return res.unsupportedPayload()
      break;

    default:
      return res.unsupportedPayload()
  }
}
