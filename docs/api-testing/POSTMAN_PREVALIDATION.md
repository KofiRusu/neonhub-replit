# Postman Collection Prevalidation (2025-11-22)

- Collection: `postman/NeonHub-API.postman_collection.json`
- Total folders inspected: **21**
- Total requests discovered: **74**
- Requests with inline Postman tests: **74**
- Requests missing tests: **0**

## Folder Structure Snapshot
```
Health & System
Auth & Users
Campaigns
Email Agent
Social Agent
SEO Agent
Keywords & Personas
Connectors
Jobs & Queues
Settings
Billing & Finance
Tasks
Team & Access
Governance & Data Trust
SMS & Social
Metrics & Observability
Sitemaps
E2E – Golden Flows (Flow 1 + Flow 2)
E2E – Multi-Agent Flow
```

## Observations
1. Collection currently exercises 74 request permutations versus 198 total routes in `ROUTE_INDEX.json` (intentional gap; remainder captured in coverage roadmap).
2. Every request defines at least one `tests` script, typically checking HTTP status, payload structure, and response time (<1000 ms soft guard).
3. Multi-agent coverage lives in `E2E – Multi-Agent Flow`, chaining Trend → Content → Campaign → Email → Metrics; verified presence of login bootstrap step.
4. Additional routes (Documents, Eco-Metrics, Predictive, TRPC) should be appended in a future pass per `COVERAGE_EXPANSION_PLAN.md`.
