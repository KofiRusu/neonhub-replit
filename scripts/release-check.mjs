#!/usr/bin/env node
import fs from 'fs'; import path from 'path';
const req = [
  '.env.example',
  'docs/FINTECH_OVERVIEW.md','docs/WEBHOOK_GUIDE.md','docs/LEDGER_DESIGN.md','docs/RISK_ENGINE.md',
  'docs/DEPLOY_CHECKLIST.md','docs/RUNBOOK.md','docs/API_SURFACE.md','docs/README_RELEASE.md','docs/SECURITY_CHECKLIST.md',
  'postman/Fintech_Mocks.postman_collection.json',
  'apps/api/src/fintech/webhooks/stripe.ts','apps/api/src/fintech/webhooks/plaid.ts',
  'apps/api/src/fintech/webhooks/exchange.ts','apps/api/src/fintech/webhooks/sumsub.ts',
  'scripts/final-audit.mjs','scripts/docker-compose.metrics.yml','scripts/prometheus.yml'
];
const missing = req.filter(p => !fs.existsSync(path.join(process.cwd(), p)));
if (missing.length) {
  console.log('Release check FAIL. Missing:\n - ' + missing.join('\n - '));
  process.exit(1);
}
console.log('Release check PASS. All required air-gap assets present.');
