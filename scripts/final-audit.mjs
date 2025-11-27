#!/usr/bin/env node
import fs from 'fs'; import path from 'path';

const root = process.cwd();
const cfgPath = path.join(root, 'scripts', 'audit.config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath,'utf8')) : {};
const devssdPath = cfg.devssd_path || '/Volumes/devssd';
const devssdMode = cfg.devssd_mode || 'merge'; // 'merge' | 'ignore'

const cats = [
  {k:'db',l:'Database',w:15,req:['prisma/schema.prisma','prisma/migrations']},
  {k:'apis',l:'Backend APIs',w:15,req:['apps/api/src/trpc','apps/api/src/pages/api']},
  {k:'agents',l:'Agents',w:10,req:['packages','apps/api/src/agents']},
  {k:'analytics',l:'Analytics',w:10,req:['apps/api/src/services/analytics.ts','apps/web/src/app/dashboard']},
  {k:'ui',l:'Frontend UI',w:10,req:['apps/web/src/app','apps/web/src/components']},
  {k:'fintech',l:'Fintech',w:10,req:['apps/api/src/fintech','apps/api/src/fintech/webhooks']},
  {k:'seo',l:'SEO',w:10,req:['apps/web/src/app/(seo)','docs/SEO_*']},
  {k:'cicd',l:'CI/CD',w:10,req:['.github/workflows']},
  {k:'mon',l:'Monitoring',w:5, req:['apps/api/src/metrics','scripts/docker-compose.metrics.yml']},
  {k:'docs',l:'Docs',w:5, req:['docs']},
];

const exists = p => { try { return fs.existsSync(p); } catch { return false; } };
const haveReq = (base, pattern) => {
  if (pattern.includes('*')) return exists(path.join(base, pattern.split('/')[0])) ? 1 : 0;
  return exists(path.join(base, pattern)) ? 1 : 0;
};
const scoreCat = (base,c)=> Math.round(100 * c.req.reduce((s,p)=> s + haveReq(base,p),0)/c.req.length);
const merge = (main, dev)=> Math.round(main*0.65 + dev*0.35);

const main = Object.fromEntries(cats.map(c=>[c.k, scoreCat(root,c)]));
const dev  = (devssdMode === 'ignore')
  ? Object.fromEntries(cats.map(c=>[c.k, 0]))
  : Object.fromEntries(cats.map(c=>[c.k, scoreCat(devssdPath,c)]));

const mergedByCat = (devssdMode === 'ignore')
  ? Object.fromEntries(cats.map(c=>[c.k, main[c.k]]))     // main-only scoring
  : Object.fromEntries(cats.map(c=>[c.k, merge(main[c.k], dev[c.k])]))

const overall = (() => {
  const mainWeighted = cats.reduce((s,c)=> s + main[c.k]*c.w, 0) / 100;
  const devWeighted  = cats.reduce((s,c)=> s + dev[c.k]*c.w, 0) / 100;
  const val = (devssdMode === 'ignore') ? Math.round(mainWeighted) : Math.round(merge(mainWeighted, devWeighted));
  return Math.max(0, Math.min(100, val));
})();

console.log('=== NEONHUB FINAL AUDIT ===');
console.log('Root:', root);
console.log('DevSSD:', devssdPath, `(mode: ${devssdMode})`);
console.log('Overall:', overall+'%'); console.log('');
for (const c of cats){
  const line = `${c.l.padEnd(12)} Main:${String(main[c.k]).padStart(3)}%  DevSSD:${String(dev[c.k]).padStart(3)}%  Score:${String(mergedByCat[c.k]).padStart(3)}%`;
  console.log(line);
}
