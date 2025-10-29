# 🚀 Quick Start Guide - Database Workflow

## ✅ Everything is Ready!

All issues have been found and fixed. You can now run the full workflow.

---

## 📋 Typical Run Order

```bash
# 1. Validate Prisma schema
bash ./scripts/run-and-capture.sh "pnpm --filter apps/api prisma validate"

# 2. Check migration status
bash ./scripts/run-and-capture.sh "pnpm --filter apps/api prisma migrate status"

# 3. Run migrations (if needed)
bash ./scripts/run-and-capture.sh "pnpm --filter apps/api prisma migrate deploy"

# 4. Seed database
bash ./scripts/run-and-capture.sh "pnpm --filter apps/api prisma db seed"

# 5. Test full workflow
bash ./scripts/test-full-sequence.sh
```

---

## 🛠️ Helper Scripts

### Error Capture Wrapper
```bash
bash ./scripts/run-and-capture.sh "<your-command>"
```
- Auto-logs to `logs/snags-YYYYMMDD-HHMMSS.log`
- Shows last 20 lines on failure
- Displays environment context

### Environment Setup
```bash
bash ./scripts/setup-env.sh
```
- Validates Node.js, database, dependencies
- Offers to start Docker or switch to cloud DB

### Switch to Cloud Database
```bash
bash ./scripts/use-cloud-db.sh
```
- Updates DATABASE_URL to Neon.tech
- Backs up current .env

### Fix Migration Order
```bash
bash ./scripts/fix-migration-order.sh
```
- Renames migration folders to correct chronological order

### Reset Database (⚠️ Destructive)
```bash
echo "yes" | bash ./scripts/reset-database.sh
```
- Drops all tables
- Pushes schema fresh
- Marks migrations as applied

### Full Test Suite
```bash
bash ./scripts/test-full-sequence.sh
```
- Runs 5 end-to-end tests
- Reports pass/fail summary

---

## 🐛 When Something Fails

Just paste the command + the context block that prints automatically:

```
❌ FAILED: pnpm --filter apps/api prisma migrate status
📋 Log saved: logs/snags-20251027-213324.log

=== CONTEXT (copy/paste with error) ===
Node: v20.17.0
Prisma: Environment variables loaded from .env
DB URL host (redacted): postgresql://****:****@...
Branch/Commit: main @ 1172513
Log file: logs/snags-20251027-213324.log
=== END CONTEXT ===

📎 Last 20 lines of output:
[error details...]
```

You'll get a one-liner fix! 🎯

---

## 🔥 Issues Fixed in This Session

1. ✅ pnpm not found → Added local shim to PATH
2. ✅ prisma not found → Fixed pnpm shim to cd into app dir
3. ✅ Database not reachable → Switched to Neon.tech cloud
4. ✅ Migration order wrong → Renamed folders chronologically
5. ✅ Failed migration state → Created database reset script
6. ✅ Seed TypeScript error → Changed ts-node to tsx

**Full details:** See `EXECUTION_FIXES_SUMMARY.md`

---

## 📊 Current Status

✅ Schema validated  
✅ Database connected (Neon.tech cloud)  
✅ Migrations up to date  
✅ Database seeded  
✅ All 5 end-to-end tests passing  

**You're good to go!** 🚀

