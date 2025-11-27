# Postman Coverage Matrix

Baseline generated on 2025-11-22 from the existing `postman/NeonHub-API.postman_collection.json` with `node scripts/api-testing/generate-api-test-matrix.mjs`. Full JSON lives in `docs/api-testing/COVERAGE_MATRIX.json`.

- **198** detected routes/procedures, **54** covered by active Postman requests (27.3%).
- Authenticated coverage now blankets most of Campaigns, Billing, Tasks, Settings, SMS/Social, and part of Governance/Data-Trust; public assets (sitemaps/metrics) gained smoke coverage.
- Critical observations: documents, eco-metrics, feedback/messages, predictive, marketing, and all tRPC routers still have **zero** scripted verification.

## Domain-by-domain coverage

| Domain | Routes | Covered | % |
| --- | ---: | ---: | ---: |
| auth | 2 | 2 | 100.0% |
| billing | 6 | 4 | 66.7% |
| brand-voice | 5 | 0 | 0.0% |
| budget | 4 | 0 | 0.0% |
| campaigns | 15 | 13 | 86.7% |
| connectors | 9 | 3 | 33.3% |
| content | 3 | 0 | 0.0% |
| credentials | 4 | 0 | 0.0% |
| data-trust | 9 | 3 | 33.3% |
| documents | 6 | 0 | 0.0% |
| eco-metrics | 8 | 0 | 0.0% |
| editorial-calendar | 5 | 0 | 0.0% |
| email | 1 | 0 | 0.0% |
| events | 1 | 0 | 0.0% |
| feedback | 6 | 0 | 0.0% |
| governance | 6 | 2 | 33.3% |
| health | 1 | 1 | 100.0% |
| jobs | 2 | 1 | 50.0% |
| keywords | 5 | 2 | 40.0% |
| marketing | 3 | 0 | 0.0% |
| messages | 8 | 0 | 0.0% |
| metrics | 3 | 2 | 66.7% |
| orchestrate | 1 | 0 | 0.0% |
| orchestration | 8 | 0 | 0.0% |
| person | 4 | 0 | 0.0% |
| personas | 5 | 2 | 40.0% |
| predictive | 5 | 0 | 0.0% |
| readyz | 1 | 0 | 0.0% |
| robots.txt | 1 | 0 | 0.0% |
| seo | 3 | 2 | 66.7% |
| settings | 5 | 3 | 60.0% |
| sitemap | 1 | 1 | 100.0% |
| sitemap.xml | 1 | 1 | 100.0% |
| sms | 3 | 3 | 100.0% |
| social | 2 | 1 | 50.0% |
| tasks | 5 | 4 | 80.0% |
| team | 10 | 4 | 40.0% |
| trends | 4 | 0 | 0.0% |
| trpc.agents | 3 | 0 | 0.0% |
| trpc.brand | 5 | 0 | 0.0% |
| trpc.content | 7 | 0 | 0.0% |
| trpc.seo | 9 | 0 | 0.0% |
| trpc.trends | 3 | 0 | 0.0% |

> **Action:** use this matrix to prioritize Postman work—start with billing, data-trust, messaging, SMS/social, and the audited admin surfaces, then add tRPC coverage using HTTP RPC calls.
