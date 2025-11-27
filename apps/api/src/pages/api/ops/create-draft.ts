// @ts-nocheck  (air-gap)
import type { NextApiRequest, NextApiResponse } from 'next'
import { withIdempotency } from '@/trpc/middleware/safety'
import { runBootstrapGuards } from '@/server/bootstrap'
runBootstrapGuards()

async function createDraft(req: NextApiRequest, res: NextApiResponse) {
  const id = 'draft_' + Math.random().toString(36).slice(2)
  return res.status(200).json({ ok: true, id })
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return withIdempotency(createDraft)(req, res)
}
