# NeonHub API Route Index

Generated on 2025-11-22 via `node scripts/api-testing/generate-api-test-matrix.mjs`. The companion machine-readable data lives in `docs/api-testing/ROUTE_INDEX.json`.

## Key metrics

- 198 externally reachable HTTP + tRPC procedures detected across Express routers and `appRouter`.
- 184 routes require authentication, 36 of those additionally sit behind the `adminIPGuard`.
- 47 audited domains (e.g., campaign, connector, team) emit audit logs via middleware.
- 18 public endpoints (health checks, sitemap assets, SDK handshake) remain unauthenticated by design.

## Domain overview

Use this table to understand which areas are exposed, how many operations they host, and whether they are guarded by auth. The JSON file lists every method/path pair with handler filenames.

| Domain | # Routes | Auth-protected | Example paths |
| --- | ---: | ---: | --- |
| auth | 2 | 2/2 | POST /auth/logout<br>GET /auth/me |
| billing | 6 | 5/6 | POST /api/billing/checkout<br>GET /api/billing/invoices<br>GET /api/billing/plan |
| brand-voice | 5 | 3/5 | POST /api/brand-voice/compose<br>POST /api/brand-voice/guardrail<br>GET /api/brand-voice/prompt/:useCase |
| budget | 4 | 4/4 | POST /api/budget/execute<br>GET /api/budget/ledger<br>POST /api/budget/plan |
| campaigns | 15 | 15/15 | GET /api/campaigns<br>POST /api/campaigns<br>DELETE /api/campaigns/:id |
| connectors | 9 | 9/9 | GET /api/connectors<br>POST /api/connectors/:name/actions/:actionId<br>POST /api/connectors/:name/api-key |
| content | 3 | 3/3 | GET /content/drafts<br>GET /content/drafts/:id<br>POST /content/generate |
| credentials | 4 | 4/4 | GET /api/credentials<br>POST /api/credentials<br>DELETE /api/credentials/:provider |
| data-trust | 9 | 9/9 | POST /api/data-trust/audit/log<br>GET /api/data-trust/audit/logs<br>POST /api/data-trust/hash |
| documents | 6 | 6/6 | GET /api/documents<br>POST /api/documents<br>DELETE /api/documents/:id |
| eco-metrics | 8 | 8/8 | POST /api/eco-metrics/carbon<br>GET /api/eco-metrics/efficiency<br>GET /api/eco-metrics/energy |
| editorial-calendar | 5 | 5/5 | GET /api/editorial-calendar<br>POST /api/editorial-calendar<br>DELETE /api/editorial-calendar/:id |
| email | 1 | 0/1 | POST /email/send |
| events | 1 | 0/1 | GET /events/timeline |
| feedback | 6 | 6/6 | GET /api/feedback<br>POST /api/feedback<br>DELETE /api/feedback/:id |
| governance | 6 | 6/6 | GET /api/governance/audit-logs<br>POST /api/governance/ethics/assess<br>POST /api/governance/evaluate |
| health | 1 | 0/1 | GET /health |
| jobs | 2 | 2/2 | GET /jobs<br>GET /jobs/:id |
| keywords | 5 | 5/5 | GET /api/keywords<br>POST /api/keywords<br>DELETE /api/keywords/:id |
| marketing | 3 | 3/3 | GET /api/marketing/campaigns<br>POST /api/marketing/campaigns<br>GET /api/marketing/overview |
| messages | 8 | 8/8 | GET /api/messages<br>POST /api/messages<br>DELETE /api/messages/:id |
| metrics | 3 | 2/3 | GET /metrics<br>POST /metrics/events<br>GET /metrics/summary |
| orchestrate | 1 | 1/1 | POST /api/orchestrate |
| orchestration | 8 | 8/8 | PUT /api/orchestration/config<br>POST /api/orchestration/failover/:nodeId<br>GET /api/orchestration/health |
| person | 4 | 4/4 | POST /api/person/:id/consent<br>GET /api/person/:id/memory<br>GET /api/person/:id/topics |
| personas | 5 | 5/5 | GET /api/personas<br>POST /api/personas<br>DELETE /api/personas/:id |
| predictive | 5 | 5/5 | GET /api/predictive/baseline<br>POST /api/predictive/execute<br>GET /api/predictive/health |
| readyz | 1 | 0/1 | GET /readyz |
| robots.txt | 1 | 0/1 | GET /api/robots.txt |
| seo | 3 | 3/3 | GET /api/seo<br>POST /api/seo/audit<br>GET /api/seo/health |
| settings | 5 | 5/5 | GET /api/settings<br>PUT /api/settings<br>PUT /api/settings/brand-voice |
| sitemap | 1 | 0/1 | POST /api/sitemap/invalidate |
| sitemap.xml | 1 | 0/1 | GET /api/sitemap.xml |
| sms | 3 | 1/3 | POST /api/sms/inbound<br>POST /api/sms/send<br>POST /sms/send |
| social | 2 | 1/2 | POST /api/social/:platform/dm<br>POST /api/social/:platform/inbound |
| tasks | 5 | 5/5 | GET /api/tasks<br>POST /api/tasks<br>DELETE /api/tasks/:id |
| team | 10 | 10/10 | GET /api/team/team/accept<br>GET /api/team/team/invitations<br>DELETE /api/team/team/invitations/:id |
| trends | 4 | 4/4 | GET /api/trends/trends<br>POST /api/trends/trends/brief<br>GET /api/trends/trends/platform/:platform |
| trpc.agents | 3 | 3/3 | TRPC.mutation trpc.agents.execute<br>TRPC.query trpc.agents.getRun<br>TRPC.query trpc.agents.listRuns |
| trpc.brand | 5 | 5/5 | TRPC.mutation trpc.brand.deleteVoiceGuide<br>TRPC.query trpc.brand.getVoiceContext<br>TRPC.query trpc.brand.listVoiceGuides |
| trpc.content | 7 | 7/7 | TRPC.mutation trpc.content.generateArticle<br>TRPC.mutation trpc.content.meta<br>TRPC.mutation trpc.content.optimize |
| trpc.seo | 9 | 9/9 | TRPC.query trpc.seo.analyzeIntent<br>TRPC.mutation trpc.seo.discoverKeywords<br>TRPC.query trpc.seo.discoverOpportunities |
| trpc.trends | 3 | 3/3 | TRPC.query trpc.trends.discover<br>TRPC.query trpc.trends.listSubscriptions<br>TRPC.mutation trpc.trends.subscribe |

> **Tip:** rerun the generator whenever Express routers or tRPC procedures change to keep both JSON/Markdown views in sync.
