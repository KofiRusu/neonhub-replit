# Roadmap — Gantt Alignment (2025-10-27)

| Phase | Focus Area | Start | Finish | Dependencies / Notes |
|-------|------------|-------|--------|----------------------|
| 1 | Core Infrastructure remediation | 2025-10-28 | 2025-10-31 | Restore toolchain (TypeScript/Next), fix docker-compose, unblock CI smoke builds |
| 2 | DB & Data stability | 2025-10-30 | 2025-11-06 | Requires Phase 1 builds; validate Prisma migrate, seeds, pgvector health |
| 3 | AI Agents integration | 2025-11-04 | 2025-11-11 | Depends on Phases 1–2; add AgentRun telemetry + tRPC bridge |
| 4 | Frontend & Chat UX | 2025-11-08 | 2025-11-18 | Needs AI APIs live; implement typing indicators, theme toggle, accessibility pass |
| 5 | Email & CRM automations | 2025-11-10 | 2025-11-20 | Build on Phase 1; expand templates, A/B execution, CRM sync verification |
| 6 | SEO & Analytics uplift | 2025-11-14 | 2025-11-22 | Requires CMS data; add keyword index, sitemap pipeline, Lighthouse run |
| 7 | Neural Memory + RAG | 2025-11-18 | 2025-12-03 | After AI agents; wire TrainingJob linkage, latency sampling, Notion export |
| 8 | Security & Governance hardening | 2025-11-20 | 2025-11-29 | Parallel with Phase 7; enforce RBAC, finalize encryption strategy |
| 9 | Automation & CI resilience | 2025-11-22 | 2025-11-30 | Needs Phases 1 & 8; add Slack notifications, stabilize QA Sentinel |
|10 | Deploy & Monitoring rollout | 2025-11-24 | 2025-12-02 | Requires CI green; verify Render/Vercel, health metrics, observability |
|11 | Docs & Test coverage | 2025-11-26 | 2025-12-05 | Consolidate updated runbooks, raise unit/E2E coverage, benchmark automation |
|12 | Enhancements (Stripe, Geo, Copilot) | 2025-11-30 | 2025-12-10 | Dependent on earlier phases; deliver geo visualizations, performance copilot, billing polish |

Milestones align sequentially; overlapping windows indicate areas that can progress once prerequisites finish. Schedule assumes immediate start after toolchain restoration.
