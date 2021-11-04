import crypto from 'crypto'

function parseHexString(hex) {
  const bytes = []
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push( parseInt(hex.substr(c, 2), 16) )
  }
  return bytes
}

function sumBytes(memo, byte) {
  memo += byte
  return memo
}

export function generateHash(nonce, secret) {
  crypto.createHash('sha256').update(nonce + secret).digest('hex')
}

export function checkProof(proof, nonce, secret, difficulty) {
  const hash = generateHash(nonce, secret)
  const bytes = parseHexString(generateHash(hash, proof))

  const isOk = bytes.slice(0, difficulty).reduce(sumBytes, 0) === 0

  if (!isOk) {
    throw new BodyValidationError('INVALID_PROOF')
  }

  return isOk
}

export function generateProof(token, difficulty) {
  let nonce = 0
  let result = null
  while (++nonce) {
    result = parseHexString( crypto.createHash('sha256').update(token + nonce).digest('hex') )
    if (result.slice(0, difficulty).reduce(sumBytes, 0) === 0) {
      break
    }
  }

  return nonce.toString()
}
