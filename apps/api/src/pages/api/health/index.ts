import type { NextApiRequest, NextApiResponse } from 'next'
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    ok: true,
    ts: new Date().toISOString(),
    mocks: process.env.USE_MOCK_ADAPTERS !== 'false',
    fintech_enabled: process.env.FINTECH_ENABLED === 'true'
  })
}
