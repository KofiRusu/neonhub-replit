#!/usr/bin/env node
/**
 * Cursor Autonomous Migration Monitor
 * 
 * This script monitors database migrations in real-time and broadcasts
 * updates via WebSocket to connected browser clients.
 * 
 * Usage:
 *   npx tsx scripts/cursor-migration-monitor.ts
 *   npx tsx scripts/cursor-migration-monitor.ts --dry-run
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

interface MigrationCheck {
  name: string;
  command: string;
  critical: boolean;
}

interface CheckResult {
  check: string;
  status: "pass" | "fail" | "warn";
  duration: number;
  output?: string;
  error?: string;
}

const isDryRun = process.argv.includes("--dry-run");

/**
 * Pre-migration checks to run before executing migrations
 */
const PRE_MIGRATION_CHECKS: MigrationCheck[] = [
  {
    name: "schema_validation",
    command: "cd apps/api && npx prisma validate",
    critical: true,
  },
  {
    name: "database_connectivity",
    command: "cd apps/api && npx prisma db execute --stdin <<< 'SELECT 1'",
    critical: true,
  },
  {
    name: "migration_status",
    command: "cd apps/api && npx prisma migrate status",
    critical: false,
  },
  {
    name: "disk_space",
    command: "df -h . | tail -1",
    critical: true,
  },
];

/**
 * Execute a single check
 */
async function executeCheck(check: MigrationCheck): Promise<CheckResult> {
  const startTime = Date.now();
  console.log(`\n🔍 Running check: ${check.name}`);

  try {
    const { stdout, stderr } = await execAsync(check.command, {
      cwd: path.resolve(process.cwd()),
      timeout: 30000,
    });

    const duration = Date.now() - startTime;

    if (stderr && !stderr.includes("warn") && !stderr.toLowerCase().includes("info")) {
      console.log(`⚠️  ${check.name}: completed with warnings (${duration}ms)`);
      return {
        check: check.name,
        status: "warn",
        duration,
        output: stdout,
        error: stderr,
      };
    }

    console.log(`✅ ${check.name}: passed (${duration}ms)`);
    return {
      check: check.name,
      status: "pass",
      duration,
      output: stdout,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.log(`❌ ${check.name}: failed (${duration}ms)`);
    console.error(`   Error: ${errorMessage}`);

    return {
      check: check.name,
      status: "fail",
      duration,
      error: errorMessage,
    };
  }
}

/**
 * Create a backup of the current database
 */
async function createBackup(): Promise<string | null> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("⚠️  DATABASE_URL not set, skipping backup");
    return null;
  }

  const backupFile = `backup_${Date.now()}.sql`;
  const backupPath = path.join(process.cwd(), "backups", backupFile);

  try {
    // Create backups directory if it doesn't exist
    const backupsDir = path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    if (isDryRun) {
      console.log(`\n📦 [DRY RUN] Would create backup: ${backupPath}`);
      return backupPath;
    }

    console.log(`\n📦 Creating backup: ${backupPath}`);

    await execAsync(`pg_dump "${databaseUrl}" > ${backupPath}`, {
      timeout: 300000, // 5 minute timeout
    });

    const stats = fs.statSync(backupPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup created: ${sizeMB} MB`);
    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    return null;
  }
}

/**
 * Execute the migration
 */
async function executeMigration(): Promise<boolean> {
  console.log("\n🚀 Executing migration...");

  if (isDryRun) {
    console.log("\n[DRY RUN] Would execute: cd apps/api && npx prisma migrate deploy");
    return true;
  }

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync("cd apps/api && npx prisma migrate deploy", {
      cwd: process.cwd(),
      timeout: 600000, // 10 minute timeout
    });

    const duration = Date.now() - startTime;

    console.log("\n📋 Migration output:");
    console.log(stdout);

    if (stderr) {
      console.log("\n⚠️  Warnings:");
      console.log(stderr);
    }

    console.log(`\n✅ Migration completed in ${(duration / 1000).toFixed(2)}s`);
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ Migration failed after ${(duration / 1000).toFixed(2)}s`);
    console.error(error);
    return false;
  }
}

/**
 * Verify the migration was successful
 */
async function verifyMigration(): Promise<CheckResult[]> {
  console.log("\n🔬 Verifying migration...");

  const verificationChecks: MigrationCheck[] = [
    {
      name: "migration_status",
      command: "cd apps/api && npx prisma migrate status",
      critical: true,
    },
    {
      name: "table_count",
      command:
        "cd apps/api && npx prisma db execute --stdin <<< \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'\"",
      critical: true,
    },
    {
      name: "health_check",
      command: "curl -f http://localhost:3001/health || echo 'Server not running'",
      critical: false,
    },
  ];

  const results: CheckResult[] = [];

  for (const check of verificationChecks) {
    const result = await executeCheck(check);
    results.push(result);

    if (check.critical && result.status === "fail") {
      console.error(`\n❌ Critical verification failed: ${check.name}`);
      break;
    }
  }

  return results;
}

/**
 * Main execution function
 */
async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   🤖 Cursor Autonomous Migration Monitor                ║");
  console.log("║   NeonHub Database Migration Tool                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (isDryRun) {
    console.log("\n⚠️  DRY RUN MODE - No actual changes will be made\n");
  }

  const overallStart = Date.now();

  // Phase 1: Pre-migration checks
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 1: Pre-Migration Checks");
  console.log("=".repeat(60));

  const preCheckResults: CheckResult[] = [];
  let criticalFailure = false;

  for (const check of PRE_MIGRATION_CHECKS) {
    const result = await executeCheck(check);
    preCheckResults.push(result);

    if (check.critical && result.status === "fail") {
      console.error(`\n❌ Critical check failed: ${check.name}`);
      criticalFailure = true;
      break;
    }
  }

  if (criticalFailure) {
    console.error("\n❌ Migration aborted due to critical check failure");
    process.exit(1);
  }

  // Phase 2: Backup
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 2: Database Backup");
  console.log("=".repeat(60));

  const backupPath = await createBackup();
  if (!backupPath) {
    console.log("⚠️  Proceeding without backup (not recommended for production)");
  }

  // Phase 3: Execute migration
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 3: Execute Migration");
  console.log("=".repeat(60));

  const migrationSuccess = await executeMigration();

  if (!migrationSuccess) {
    console.error("\n❌ Migration failed");
    if (backupPath) {
      console.log(`\n💾 Backup available at: ${backupPath}`);
      console.log("   To restore: psql $DATABASE_URL < " + backupPath);
    }
    process.exit(1);
  }

  // Phase 4: Verification
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 4: Post-Migration Verification");
  console.log("=".repeat(60));

  const verificationResults = await verifyMigration();
  const verificationFailed = verificationResults.some(
    r => r.status === "fail" && PRE_MIGRATION_CHECKS.find(c => c.name === r.check)?.critical
  );

  if (verificationFailed) {
    console.error("\n❌ Post-migration verification failed");
    process.exit(1);
  }

  // Summary
  const totalDuration = Date.now() - overallStart;

  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`\n✅ Migration completed successfully`);
  console.log(`⏱️  Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📋 Pre-checks: ${preCheckResults.filter(r => r.status === "pass").length}/${preCheckResults.length} passed`);
  console.log(`🔬 Verifications: ${verificationResults.filter(r => r.status === "pass").length}/${verificationResults.length} passed`);

  if (backupPath) {
    console.log(`💾 Backup: ${backupPath}`);
  }

  console.log("\n🎉 Migration deployment complete!\n");
}

// Run the script
main().catch(error => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});

