#!/usr/bin/env node
import fs from 'fs'; import path from 'path';
const must = [
  'docs/SEO_ROADMAP.md','docs/SEO_CHECKLIST.md','docs/seo/CONTENT_TEMPLATES.md',
  'docs/legal/PRIVACY_TEMPLATE.md','docs/legal/TERMS_TEMPLATE.md',
  'public/robots.txt','public/sitemap.xml','.env.example'
];
const miss = must.filter(p => !fs.existsSync(path.join(process.cwd(), p)));
if (miss.length){ console.log('SEO/Legal check FAIL:\n - '+miss.join('\n - ')); process.exit(1); }
console.log('SEO/Legal check PASS. All artifacts present.');
