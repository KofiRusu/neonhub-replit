# KT_EXECUTIVE_SUMMARY

## Status @ 2025-11-10
| Track | Readiness | Highlights |
| --- | --- | --- |
| Database | ⚠️ Schema validated locally; migrations blocked because no DSN. pgvector + citext extensions live; seeds hydrate Org/Brand/Agents. |
| Agent Infrastructure | ⚠️ AgentRun + ToolExecution telemetry wired (AsyncLocalStorage + connector proxy). Smoke tests cover orchestrator + BullMQ metrics, but production still lacks a worker fleet and depends on mock connectors. |
| Connectors & Compliance | ✅ `USE_MOCK_CONNECTORS` flag enforced; 17 mock providers cover Gmail/Slack/Twilio/etc; least-privilege SQL plan drafted. Need Agency to provision roles + secrets. |
| CI / Automation | ⚠️ Workflows defined (drift/backup/deploy) and `db-deploy.yml` hardened (PGOPTIONS, retries, seed gating). `pnpm install --frozen-lockfile` still fails until the lockfile is regenerated offline. |

## Top Risks & Mitigations
1. **Missing DSNs prevent drift/deploy** – Mitigation: Agency provides redacted `DATABASE_URL_APP` / `DATABASE_URL_MIGRATE`, rerun `prisma migrate status`, archive `.tmp/db-drift.sql`.
2. **Lockfile/install instability** – Mitigation: Codex regenerates `pnpm-lock.yaml` from a dependency mirror or ships an offline store bundle so CI can run `pnpm install --frozen-lockfile` without touching npmjs.
3. **Prometheus not scraped in prod** – Mitigation: Ops adds `/metrics` scrape config + alerting (docs now include sample output and checklist call-out).
4. **Legacy Jest suites still noisy** – Mitigation: keep `keyword-research.service.test.ts` skipped / `setup-integration.ts` on `ts-nocheck` until the underlying services land; targeted smoke command already proves persistence + queue telemetry.

## 4-Week Plan (focus on automation, minimal touch from Agency)
| Week | Focus | Owners |
| --- | --- | --- |
| Week 1 | Regenerate `pnpm-lock.yaml` (offline) so CI installs succeed; document install steps in `KT_SIGNALS.md`. | [Codex] |
| Week 2 | Wire DSNs + drift workflow (`db-drift-check.yml`), capture `.tmp/db-drift.sql`, and keep smoke command in CI. | [Agency]+[Codex] |
| Week 3 | Roll out least-privilege roles (`neonhub_app/migrate/readonly`) and rotate GitHub secrets. | [Shared] |
| Week 4 | Add Prometheus scrape + alerting, then run `db-drift-check → db-deploy → security-preflight` (with mocks) before Agency approves prod deploy. | [Shared/Agency] |

## What’s left for Agency (≤ 5 hrs)
- Provide redacted `DATABASE_URL_APP` + `DATABASE_URL_MIGRATE` secrets so Prisma drift/deploy workflows can execute.
- Create `neonhub_migrate`, `neonhub_app`, `neonhub_readonly` roles in Neon, rotate credentials, and drop them into GitHub environment secrets as outlined in `docs/security/LEAST_PRIVILEGE_ROLES.md`.
- After Codex publishes the refreshed lockfile + CI hardening, run the one-click chain: `db-drift-check → db-deploy → security-preflight` in GitHub Actions and confirm `/metrics` scrape returns `neonhub_` counters.

## Cost Split / Ownership
- **[Codex]** – All code/doc deliverables in this KT package, lockfile regeneration, ToolExecution instrumentation, Jest smoke, CI hardening.
- **[Agency]** – Env-bound actions only (secrets, DSNs, Prom scrape, approval taps); target effort <5 hours total.
- **[Shared]** – Least-privilege rollout + final verification steps that touch both code and infrastructure.

## Immediate Next Steps
1. Accept this KT bundle, confirm receipt of `KT_TASKS_BREAKDOWN.csv` + `KT_PACKAGE_INDEX.md`.
2. Supply DSNs + secrets so Codex can finish drift/deploy verification.
3. Approve Codex to regenerate `pnpm-lock.yaml` and push CI updates.
4. Schedule Agency-run `db-drift-check` once secrets land; archive `.tmp/db-drift.sql` for auditors.
5. After tasks close, trigger `security-preflight.yml` and capture the green Action run link inside `KT_SIGNALS.md`.
