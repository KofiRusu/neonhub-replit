# API Bootstrap Sequence Map

**Goal**: Track initialization order and identify bottlenecks before `server.listen()`.

## Canonical Dev Command
```bash
cd /Users/kofirusu/Desktop/NeonHub/apps/api
npm run dev
```

**Execution**: `node ../../scripts/run-cli.mjs tsx watch src/server.ts`

**Entrypoint**: `apps/api/src/server.ts`

---

## Bootstrap Sequence (from server.ts)

### Module Load Phase
1. **Import declarations** (~45+ imports from routes, services, middleware)
   - Heavy imports: orchestrate.ts, connectors/index.ts, services/orchestration/*
   - Database: Prisma client initialized at module load
   - External: OpenAI, Stripe, Sentry clients

2. **Environment Validation** (`env.ts` lazy-loaded on first access)
   - Zod schema validation with fallbacks
   - Missing vars → relaxed defaults warning

### Async Initialization Phase (BEFORE `listen`)
3. **Sentry Init** (`initSentry()`)
   - Synchronous if DSN not set; async if enabled

4. **Register Connectors** (`registerConnectors()` → `syncRegisteredConnectors()`)
   - ⚠️ **POTENTIALLY BLOCKING**: Database queries, external API calls

5. **SEO Analytics Job** (`startSeoAnalyticsJob()`)
   - ⚠️ **POTENTIALLY BLOCKING**: Job initialization, scheduler setup

6. **Queue Workers** (`startAllWorkers()`)
   - ⚠️ **POTENTIALLY BLOCKING**: Redis/BullMQ connections, worker process startup

7. **Default Agents** (`registerDefaultAgents()`)
   - ⚠️ **POTENTIALLY BLOCKING**: Orchestration bootstrap, agent initialization

### Listen Phase
8. **HTTP Server Listen** (`httpServer.listen(port)`)
   - Should print: `🚀 NeonHub API server started`

---

## Resolution Status

| Issue | Status | Solution |
|-------|--------|----------|
| Process hangs before listen | **✅ FIXED** | Moved init to async IIFE after listen() call |
| Heavy init blocks startup | **✅ FIXED** | Added ENABLE_* env flags to skip in dev |
| No error output | **✅ FIXED** | Added bootLog() function for file + console |
| ENCRYPTION_KEY missing | **✅ FIXED** | Now required env var with fallback logging |
| Bootstrap instrumentation | **✅ ADDED** | [BOOT] nn - messages with timeout guards |

---

## Final Bootstrap Log (Success)

```
[BOOT] 00 - Module loading starting
[BOOT] 01 - Env config loaded
[BOOT] 02 - All imports complete
[BOOT] 03 - Starting async initialization
[BOOT] 04 - Sentry init starting
[BOOT] 05 - Sentry init complete
[BOOT] 06 - SKIPPED registerConnectors (ENABLE_CONNECTORS=false)
[BOOT] 08 - SKIPPED startSeoAnalyticsJob (ENABLE_SEO_ANALYTICS_JOB=false)
[BOOT] 10 - SKIPPED startAllWorkers (ENABLE_WORKERS=false)
[BOOT] 12 - SKIPPED registerDefaultAgents (ENABLE_ORCHESTRATION_BOOTSTRAP=false)
[BOOT] 14 - Bootstrap initialization complete
[BOOT] 15 - About to call httpServer.listen() on port 3001
[BOOT] ✓ 16 - SERVER LISTENING ON PORT 3001
```

**✅ Server successfully listens on http://localhost:3001/api**

---

## Implementation Details

See `DEV_BOOTSTRAP_BEHAVIOUR.md` for:
- Root cause analysis
- Solution architecture
- Timeout guards
- Production vs dev behavior
- Full feature flag reference

