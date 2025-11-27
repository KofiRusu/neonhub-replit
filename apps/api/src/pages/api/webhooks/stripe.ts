import type { NextApiRequest, NextApiResponse } from 'next'
import { readRawBody } from '@/lib/raw-body'
import { runBootstrapGuards } from '@/server/bootstrap'
// Import your existing handler (already added earlier in fintech/webhooks/stripe.ts)
// @ts-ignore
import stripeHandler from '@/fintech/webhooks/stripe'
runBootstrapGuards()

// Next.js pages API must disable body parsing to verify signatures
export const config = { api: { bodyParser: false } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const raw = await readRawBody(req)
    // @ts-ignore augment request so underlying handler can use it
    ;(req as any).rawBody = raw
    // Pass through to your existing handler (it expects req.rawBody, headers, env)
    // @ts-ignore
    return await stripeHandler(req, res)
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'unexpected error' })
  }
}
