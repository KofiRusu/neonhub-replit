#!/usr/bin/env node
import fs from 'fs'
const envPath = '.env'
if (!fs.existsSync(envPath)) {
  console.log('No .env found. Create it from .env.example first.'); process.exit(1)
}
let t = fs.readFileSync(envPath,'utf8')
const v = process.argv[2]
if (!['on','off'].includes(v)) { console.log('Usage: node scripts/toggle-mocks.mjs [on|off]'); process.exit(1) }
t = t.replace(/USE_MOCK_ADAPTERS\s*=\s*(true|false)/g, `USE_MOCK_ADAPTERS=${v==='on'?'true':'false'}`)
fs.writeFileSync(envPath, t)
console.log(`Mocks now ${v.toUpperCase()}.`)
