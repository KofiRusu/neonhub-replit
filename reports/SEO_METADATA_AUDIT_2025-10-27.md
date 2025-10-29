# SEO Metadata Audit — 2025-10-27

## Summary
- **Tool used:** `npm run seo:lint` (scripts/seo-lint.mjs) — run on 2025-10-27.
- **Scope:** Static routes under `apps/web/src/app/`.
- **Findings:** 21 routes do not export `metadata` / `generateMetadata`. No titles, descriptions, or canonical tags are currently set for these paths.
- **Next step:** Backfill metadata using keyword targets once analytics access is restored (see `docs/seo/keyword-map-template.csv`).

## Routes Missing Metadata
| Path | File | Notes |
| --- | --- | --- |
| `/` | apps/web/src/app/page.tsx | Homepage |
| `/agents` | apps/web/src/app/agents/page.tsx | Agent overview |
| `/analytics` | apps/web/src/app/analytics/page.tsx | Product analytics overview |
| `/auth/signin` | apps/web/src/app/auth/signin/page.tsx | Sign-in screen (should include canonical) |
| `/billing` | apps/web/src/app/billing/page.tsx | Billing portal |
| `/brand-voice` | apps/web/src/app/brand-voice/page.tsx | Brand voice features |
| `/campaigns` | apps/web/src/app/campaigns/page.tsx | Campaign management |
| `/content` | apps/web/src/app/content/page.tsx | Content generation |
| `/dashboard` | apps/web/src/app/dashboard/page.tsx | Main dashboard |
| `/deployment` | apps/web/src/app/deployment/page.tsx | Deployment tooling |
| `/documents` | apps/web/src/app/documents/page.tsx | Document handling |
| `/email` | apps/web/src/app/email/page.tsx | Email automation |
| `/feedback` | apps/web/src/app/feedback/page.tsx | Feedback workflows |
| `/messaging` | apps/web/src/app/messaging/page.tsx | Messaging hub |
| `/metrics` | apps/web/src/app/metrics/page.tsx | Metrics overview |
| `/settings` | apps/web/src/app/settings/page.tsx | Account settings |
| `/social-media` | apps/web/src/app/social-media/page.tsx | Social media tools |
| `/support` | apps/web/src/app/support/page.tsx | Support center |
| `/tasks` | apps/web/src/app/tasks/page.tsx | Task management |
| `/team` | apps/web/src/app/team/page.tsx | Team collaboration |
| `/trends` | apps/web/src/app/trends/page.tsx | Trend analysis |

## Outstanding Data
- **Keyword alignment:** pending completion of keyword map.
- **Descriptions & CTAs:** to be defined during Phase 2 execution.
- **Canonical URLs:** to be included once metadata is backfilled.

> Re-run this audit after metadata patches are applied; update this report with completion status.
