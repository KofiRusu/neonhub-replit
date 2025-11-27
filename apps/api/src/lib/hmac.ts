import crypto from 'crypto'

export function hmacValid(raw: string | Buffer, signature: string | undefined, secret: string | undefined) {
  if (!signature || !secret) return false
  const calc = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  const a = Buffer.from(calc)
  const b = Buffer.from(signature)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
