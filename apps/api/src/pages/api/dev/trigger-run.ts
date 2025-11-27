// @ts-nocheck  -- air-gap placeholder (works when prisma client is available)
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
// adjust prisma import to your project layout when deps are present
// @ts-ignore
import { prisma } from '@/server/db';
const ALLOWED = process.env.DEV_TOOLS === 'true';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!ALLOWED) return res.status(403).json({ ok:false, error:'DEV_TOOLS disabled' });
  try {
    const orgId = (req.query.orgId as string) || 'org_DEV';
    const agentName = (req.query.agent as string) || 'ContentAgent';
    const objective = (req.query.obj as string) || 'health-check';
    const inputHash = crypto.createHash('sha256').update(agentName + objective + Date.now()).digest('hex');
    const run = await prisma.agentRun.create({ data:{ orgId, agentName, objective, status:'RUNNING', inputHash }});
    await prisma.runStep.create({ data:{ runId: run.id, name:'dummy-step', status:'SUCCESS', durationMs:42, payload:{ ping:'pong' }, result:{ ok:true }}});
    await prisma.agentRun.update({ where:{ id: run.id }, data:{ status:'SUCCESS', completedAt:new Date(), durationMs:50 }});
    res.status(200).json({ ok:true, runId: run.id });
  } catch (e:any) { res.status(500).json({ ok:false, error: e?.message || 'unknown' }); }
}
