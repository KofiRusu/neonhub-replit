# KT_CI_SUMMARY

## Database Workflows
| Workflow | Purpose | Key Steps | Notes / Gaps |
| --- | --- | --- | --- |
| `db-drift-check.yml` | Scheduled + PR drift detection | Checks `DATABASE_URL`, installs pnpm, runs `prisma migrate status` + `prisma migrate diff` (uploads artifact on drift) | Skips entirely if secret missing; add doc so Agency supplies redacted DSN. Consider setting `PGOPTIONS='-c lock_timeout=15000 -c statement_timeout=60000'` per hardening doc. |
| `db-backup.yml` | Nightly + manual logical backup | Installs `pg_dump`, compresses, uploads artifact + optional S3 copy, cleans old objects | Requires AWS secrets; verify `aws s3` cleanup block once credentials exist. |
| `db-deploy.yml` | Manual migrate deploy | pnpm install, prisma generate/validate/migrate, optional seed behind `RUN_SEED` input, Slack notify | ✅ Updated to use `${{ secrets.DATABASE_URL_APP }}` / `${{ secrets.DATABASE_URL_MIGRATE }}`, sets `PGOPTIONS`, enables pg-client flags, retries migrate/seed (3x), and defaults `RUN_SEED` to `false` per `ci/db-deploy.hardening.md`. Remaining gap: secrets must be created with the new names. |
| `db-backup-and-deploy.yml`, `db-diff.yml`, `db-restore.yml` | Supporting tasks | Compose backups with deploy, produce diffs, and restore using artifacts | Each inherits same dependency on secrets + pnpm install; consider moving to reusable workflow once lockfile stabilizes. |

## Application / QA Workflows
- `ci.yml`, `ci-light.yml`, `ci-ai.yml`, `ci-p0.yml`, `ci-p0-hardening.yml`: run lint/typecheck/test across pnpm workspace. All assume `pnpm install --frozen-lockfile`, which currently fails due to mismatched `core/llm-adapter` deps; action will keep failing until lockfile regenerated or `--no-frozen-lockfile` used in air-gapped runs.
- `qa-sentinel.yml`, `security-preflight.yml`, `repo-validation.yml`: guard rails for policy + code-owners. None can run offline (depend on GitHub API, npm registry).
- Deploy flows (`deploy-staging.yml`, `deploy-prod.yml`, `validate-live.yml`): call DB workflows plus Next.js/Express builds; currently blocked at the install step.

## Signals & Evidence
- Could not fetch live results via `gh run list --limit 10` (network restricted). Latest known definitions reviewed manually under `.github/workflows`.
- Evidence of previous DB telemetry lives in `CI_DB_DEPLOY_REPORT.md` and `DB_DEPLOYMENT_RUNBOOK.md` (unchanged).

## Recommended Actions
1. **Roll out the hardened pattern** elsewhere (`ci/db-deploy.hardening.md` now applied to `db-deploy.yml`): propagate PG options + retry logic to `db-backup-and-deploy.yml`, deploy workflows, and any script that still touches `prisma migrate`.
2. **Provide offline lockfile**: regenerate `pnpm-lock.yaml` (workspace root) so all workflows using `pnpm install --frozen-lockfile` can succeed without network writes. For air-gapped builds, bundle `pnpm store prune` artifacts or fall back to `npm install --prefer-offline`.
3. **Secret hygiene**: create GitHub environment secrets for `DATABASE_URL_APP`, `DATABASE_URL_MIGRATE`, `AWS_*`, `SLACK_WEBHOOK_URL`. Without them, DB workflows no-op.
4. **Selective test runs**: until ts-jest blockers (`keyword-research`, `setup-integration`) are patched, mark those suites with `test.skip` or move them into an opt-in job to keep the rest of CI green.
5. **Action ordering**: ensure pnpm is installed *before* `actions/setup-node` (already true in `db-deploy.yml`); replicate that order in other workflows that still rely on the older pattern.
