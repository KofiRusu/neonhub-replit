# Manual Seed Execution — 2025-10-26 20:41:18 UTC
Author = GPT-5

Command:
```
psql "$DATABASE_URL" -f .tmp/manual_seed.sql
```

Result:
```
BEGIN
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 2
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 2
INSERT 0 2
INSERT 0 3
COMMIT
```

Notes:
- Applied `.tmp/manual_seed.sql` to mirror `seed.ts` baseline because Prisma Client generation was initially unavailable.
- Inserts cover Organization → Brand → Agent → Dataset → Campaign hierarchy with deterministic IDs for idempotent seeding.

---

# tsx Seed Run — 2025-10-26 20:41:18 UTC
Author = GPT-5

Command:
```
node scripts/run-cli.mjs tsx apps/api/prisma/seed.ts
```

Result:
```
🌱 Seeding NeonHub baseline data...
✅ Founder: founder@neonhub.ai
✅ Organization: neonhub
✅ Brand voice: brandvoice-neonhub
✅ Agent: brand-voice-copilot
✅ Dataset: brand-knowledge-base
✅ Campaign: NeonHub Fall Launch
✨ Seeding completed!
```

Notes:
- Confirms `apps/api` seed script executes via repository helper with existing dependencies.
- Manual SQL seed remains documented as a fallback for sandboxed environments.
