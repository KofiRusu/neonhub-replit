import type { NextApiRequest, NextApiResponse } from 'next'
import { hmacValid } from '@/lib/hmac'

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<any>

export function withIdempotency(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const key = req.headers['idempotency-key']
    void key // TODO: in production persist key to prevent duplicates
    return handler(req, res)
  }
}

export function requireInternalSignature(handler: Handler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const sig = req.headers['x-internal-sign']
    const secret = process.env.INTERNAL_SIGNING_SECRET
    const useMocks = process.env.USE_MOCK_ADAPTERS !== 'false'
    const isProd = process.env.NODE_ENV === 'production'
    if (isProd && !useMocks) {
      const rawSource = (req as any).rawBody ?? JSON.stringify(req.body ?? {})
      const raw = typeof rawSource === 'string' || Buffer.isBuffer(rawSource)
        ? rawSource
        : JSON.stringify(rawSource)
      if (!hmacValid(raw, typeof sig === 'string' ? sig : undefined, secret)) {
        return res.status(401).json({ ok: false, error: 'invalid signature' })
      }
    }
    return handler(req, res)
  }
}
