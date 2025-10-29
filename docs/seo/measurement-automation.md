# SEO Measurement & Automation Notes

## Dashboards
- Build Looker or GA4 Explorations with the following tabs:
  - Traffic & Engagement (sessions, CTR, bounce, time on page).
  - Conversions (sign-ups, MQLs, revenue) with attribution.
  - Content Performance (top pages by intent, decay alerts).
- Store dashboard IDs/links here once live.

## Alerts
- Configure GA4 custom alerts:
  - Organic sessions drop > 25 % vs. 7‑day average.
  - New 404 errors exceeding threshold.
  - Core Web Vitals regression (LCP > 2.5 s).
- Mirror alerts in Slack via webhook (`#seo-monitoring`).

## Data Pipelines
- Export Search Console data daily to BigQuery (use scheduled transfer) for long-term storage.
- Capture GA4 events to BigQuery using native export; backfill historical data where possible.
- Define dbt model `seo_daily_metrics` to join Search Console and GA4 for aggregated reporting.

## Automation Backlog
| Priority | Task | Tooling | Status | Notes |
| --- | --- | --- | --- | --- |
| P0 | Add `npm run seo:lint` to CI once pnpm tooling restored | GitHub Actions | Backlog | Blocked by current CI failures |
| P1 | Auto-generate XML sitemap during `next build` | next-sitemap / custom script | Backlog | Ensure robots references sitemap |
| P1 | Incorporate structured data validation (validator.nu) | Node script extension | Backlog | Requires network access |
| P2 | Implement meta/title length checker | Extend `scripts/seo-lint.mjs` | Backlog | Needs library or custom parser |
| P2 | Automate backlink monitoring import | APIs (Ahrefs/Semrush) | Backlog | Depends on credentials |

## Review Cadence
- Weekly: run `npm run seo:lint` locally (adds to PR checklist).
- Monthly: refresh dashboards, document insights, update objectives in `seo-objectives-and-kpis.md`.
- Quarterly: rerun full audit using `seo-audit-checklist.md`, feed outputs into roadmap planning.
