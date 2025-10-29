# Agent Infrastructure Monorepo

Fresh implementation of the NeonHub agent infrastructure blueprint. See `docs/AGENT_INFRA_OVERVIEW.md` for full architecture notes (to be authored in follow-up phases).

## Getting Started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env
docker compose up -d
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev:all
```
