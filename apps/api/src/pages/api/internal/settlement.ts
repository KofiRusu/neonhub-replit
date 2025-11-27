// @ts-nocheck  (air-gap)
import type { NextApiRequest, NextApiResponse } from 'next'
import { requireInternalSignature } from '@/trpc/middleware/safety'
import { runBootstrapGuards } from '@/server/bootstrap'
runBootstrapGuards()

async function core(req: NextApiRequest, res: NextApiResponse) {
  // settle operations (mock)
  return res.status(200).json({ ok: true, settled: true, note: 'signature verified if live' })
}

// Wrap with signature check (active in prod when mocks OFF)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return requireInternalSignature(core)(req, res)
}
