# NeonHub Baseline SEO Audit Playbook

Use this playbook to complete Phase A (“Planning & Audit”) and to re-run quarterly checks. Track findings in Jira using the `SEO-AUDIT` component.

## 1. Crawl & Indexation
- [ ] Run full crawl (Screaming Frog / Sitebulb). Export:
  - Broken links (4xx/5xx)
  - Redirect chains
  - Duplicate titles/meta descriptions
  - Canonical mismatches
- [ ] Verify canonical URLs resolve with 200 status.
- [ ] Ensure paginated/filtered pages have `noindex` or canonical to main listing where appropriate.
- [ ] Submit updated XML sitemap in Search Console after corrections.

## 2. Content Inventory
- [ ] Export URL list grouped by content type (blog, product, docs, landing).
- [ ] Capture metrics: sessions, conversions, bounce rate, top queries.
- [ ] Flag thin/outdated pages. Record action (“rewrite”, “redirect”, “retain”).
- [ ] Note pages lacking clear target keyword or search intent alignment.

## 3. Technical Health
- [ ] Confirm presence & validity of:
  - `robots.txt`
  - XML sitemap(s)
  - Canonical tags
  - `hreflang` (if multi-language)
  - Meta robots directives
- [ ] Check mobile friendliness (Lighthouse / Mobile Friendly Test).
- [ ] Capture Core Web Vitals (LCP, INP/FID, CLS) via PageSpeed Insights and CrUX.
- [ ] Audit HTTPS (no mixed-content warnings, HSTS enabled).
- [ ] Validate structured data with Google Rich Results Test.

## 4. Analytics & Console Setup
- [ ] Confirm GA4 tracking (events, conversions) works on staging & production.
- [ ] Ensure Search Console property covers `https://` and `www`/root variants.
- [ ] Link GA4 ↔ Search Console, ads accounts, BigQuery (if used).
- [ ] Document filters, goals, and attribution windows.

## 5. Reporting & Handover
- [ ] Summarise critical issues (P0/P1) with owners and due dates.
- [ ] Deliver full report in `reports/seo/` with CSV exports in `reports/seo/data/`.
- [ ] Present findings in Marketing & Engineering sync; log decisions in Confluence/Notion.
- [ ] Schedule re-audit date (default: +90 days).

## Templates & Resources
- Crawl export storage: `reports/seo/crawl/<YYYY-MM-DD>/`
- Content inventory sheet: `reports/seo/content-inventory.csv`
- Audit summary deck template: `docs/seo/templates/audit-summary-template.pptx` _(to be added if needed)_

## Completion Record
| Date | Lead | Status | Notes |
| --- | --- | --- | --- |
| _TBD_ |  |  |  |
