# Phase 3 Launch Plan – Backend Completion Sprint

**Window**: November 1 – November 21, 2025  
**Objective**: Raise backend readiness from 74% → ≥88% by completing connector catalog, restoring green CI, and wiring agent telemetry to UI consumers.  
**Status**: 🟢 Ready to start (all Phase 2 exit criteria met)

---

## 🎯 Phase Outcomes
- ✅ Ship production-grade implementations for remaining connectors (TikTok, Google Ads, Shopify, LinkedIn, webhook triggers).
- ✅ Achieve ≥80% backend coverage with stable Jest pipeline and centralized cache directory.
- ✅ Provide integration-ready tRPC endpoints + typed client hooks for the Next.js UI.
- ✅ Establish nightly validation loop (typecheck, lint, coverage, limited e2e smoke) with artifacts logged.

---

## 🧑‍🤝‍🧑 Workstreams & Owners

| Workstream | Owner | Focus | Success Criteria |
| --- | --- | --- | --- |
| Connector Expansion | Codex Terminal A | Implement missing connectors, mocks, typed action schemas, registry wiring | 5 new connectors delivered with passing unit tests and docs |
| Test & QA Scaling | Codex Terminal B | Fix legacy failing suites, configure Jest cache, raise coverage, author integration tests | Global coverage ≥80%, no flake on 3 consecutive runs |
| Validation & Ops | Neon Agent | Daily triage, CI tuning, deployment rehearsal, metrics dashboards | Nightly `pnpm validate` suite green, release notes published weekly |

---

## 📆 Execution Timeline (10 Working Days)

| Day | Terminal A | Terminal B | Neon Agent |
| --- | --- | --- | --- |
| Day 0 (Prep) | Sync on connector specs, confirm credentials matrix | Establish Jest cache path & env overrides | Publish kickoff note, verify environments |
| Day 1 | TikTok connector + mocks/tests | Restore `simulation-engine.test.ts`, stabilize Slack/Gmail suites | Review PRs, merge gating fixes |
| Day 2 | Google Ads connector + reporting action | Configure `JEST_CACHE_DIR`, re-run coverage pipeline | Capture coverage delta, log in `logs/coverage/day2.md` |
| Day 3 | Shopify connector + inventory/webhook triggers | Author connector integration test harness | Validate Prisma migrations & seeds on fresh DB |
| Day 4 | LinkedIn connector + campaign actions | Write agent-run integration test (execute → metrics persisted) | Update PHASE3_STATE.md + risk log |
| Day 5 | Webhook trigger framework & batch jobs | Execute full suite with coverage, document gaps | Prepare mid-sprint review doc |
| Day 6 | Buffer & polish (rate limits, retries) | Address coverage deficits, add mocks for new connectors | Run `pnpm --filter apps/web test:e2e` smoke |
| Day 7 | Docs & handoff packages | Final regression, snapshot coverage report | Compose sprint summary & readiness checklist |

---

## ✅ Definition of Done
- All connectors registered in `apps/api/src/connectors/index.ts` with corresponding mocks + tests.
- Jest passes via `pnpm --filter @neonhub/backend-v3.2 test:coverage` without coverage threshold failures.
- Prisma migrations verified via `pnpm db:migrate` + `pnpm --filter @neonhub/backend-v3.2 prisma:status`.
- Agent run telemetry accessible through `agents.listRuns` & `agents.getRun` procedures with sanitized outputs.
- Documentation updated: connector usage guide, testing playbook, updated PHASE3_STATE.md.
- Deployment artifacts (Dockerfiles, render.yaml) validated with new connectors (ENV vars documented).

---

## 🔧 Tooling & Commands
- `JEST_CACHE_DIR=./tmp/jest-cache pnpm --filter @neonhub/backend-v3.2 test:coverage`
- `pnpm --filter @neonhub/backend-v3.2 prisma:migrate deploy --preview-feature`
- `pnpm --filter apps/web dev` with proxy to validate agent router integration.
- `scripts/safe-move-to-devssd.sh` for workstation relocation before long test runs.
- `pnpm --filter @neonhub/backend-v3.2 lint && pnpm --filter @neonhub/backend-v3.2 typecheck` (daily baseline).

---

## 📈 Metrics & Reporting
- **Coverage**: Track statements, branches, lines; archive JSON in `logs/coverage/YYYY-MM-DD.json`.
- **Connector SLA**: Response time & retry counts logged per action; aggregate via new telemetry fields.
- **Defect Density**: Issues per connector/test tracked in `PHASE3_STATE.md`.
- **Velocity**: Story count per agent, updated daily.

---

## ⚠️ Risks & Mitigations
- **ENOSPC on Jest cache** → Pre-create workspace-local cache dir (`tmp/jest-cache`) and purge nightly.
- **Third-party rate limits** → Stub heavy external calls within mocks; keep e2e tests offline-first.
- **Coverage regression** → Introduce incremental coverage threshold enforcement (per directory) before re-enabling 95% global target.
- **Frontend lag** → Schedule daily sync with UI maintainers; export tRPC client bindings once endpoints stabilize.

---

## 📜 Deliverables Checklist
- Connector implementations + mocks + unit tests.
- Updated registry + documentation (`docs/CONNECTOR_GUIDE.md` refresh).
- Integration test suite + coverage reports in `logs/coverage/`.
- Updated `PHASE3_STATE.md` and final `PHASE3_COMPLETION_REPORT.md`.
- Sprint summary for stakeholders with go/no-go recommendation.

---

## 🚀 Kickoff Prerequisites
1. Ensure `pnpm install --frozen-lockfile` is up to date across workspaces.
2. Provision sandbox credentials for TikTok, Google Ads, Shopify, LinkedIn (store references in 1Password vault).
3. Allocate nightly CI runner with ≥15 GB free space for Jest cache and Prisma artifacts.
4. Confirm Sentry DSN + pgvector extensions configured in staging DB (run `pnpm --filter @neonhub/backend-v3.2 prisma:validate`).

---

**Launch Authorization**: ✅ Granted. Begin execution with Day 0 prep tasks and log progress in `PHASE3_STATE.md`.
