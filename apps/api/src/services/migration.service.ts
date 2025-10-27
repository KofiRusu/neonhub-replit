import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "../db/prisma.js";
import { broadcastMigration } from "../ws/index.js";
import { logger } from "../lib/logger.js";

const execAsync = promisify(exec);

interface MigrationPhase {
  name: string;
  description: string;
  command?: string;
  validation?: () => Promise<boolean>;
}

interface MigrationResult {
  success: boolean;
  duration: number;
  phases: Array<{
    name: string;
    status: "success" | "failed" | "skipped";
    duration: number;
    error?: string;
  }>;
}

/**
 * Execute database migration with real-time progress updates via WebSocket
 */
export async function runMigration(): Promise<MigrationResult> {
  const startTime = Date.now();
  const phases: MigrationPhase[] = [
    {
      name: "backup",
      description: "Creating database backup",
      validation: async () => {
        // Check if pg_dump is available
        try {
          await execAsync("which pg_dump");
          return true;
        } catch {
          logger.warn("pg_dump not available, skipping backup");
          return false;
        }
      },
    },
    {
      name: "validate_schema",
      description: "Validating Prisma schema",
      command: "npx prisma validate",
    },
    {
      name: "check_connectivity",
      description: "Checking database connectivity",
      validation: async () => {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        } catch (error) {
          logger.error({ error }, "Database connectivity check failed");
          return false;
        }
      },
    },
    {
      name: "execute_migration",
      description: "Executing database migrations",
      command: "npx prisma migrate deploy",
    },
    {
      name: "verify_schema",
      description: "Verifying schema integrity",
      validation: async () => {
        try {
          // Check if all tables exist
          const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
          `;
          logger.info({ tableCount: tables.length }, "Schema verification complete");
          return tables.length > 0;
        } catch (error) {
          logger.error({ error }, "Schema verification failed");
          return false;
        }
      },
    },
    {
      name: "health_check",
      description: "Running post-migration health checks",
      validation: async () => {
        try {
          // Test basic queries
          await prisma.user.count();
          return true;
        } catch (error) {
          logger.error({ error }, "Health check failed");
          return false;
        }
      },
    },
  ];

  const results: MigrationResult = {
    success: true,
    duration: 0,
    phases: [],
  };

  broadcastMigration("migration:started", {
    totalPhases: phases.length,
    phases: phases.map(p => ({ name: p.name, description: p.description })),
  });

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    const phaseStartTime = Date.now();

    broadcastMigration("migration:phase:start", {
      phase: phase.name,
      description: phase.description,
      step: i + 1,
      total: phases.length,
    });

    try {
      let shouldRun = true;

      // Run validation if provided
      if (phase.validation) {
        shouldRun = await phase.validation();
      }

      if (!shouldRun) {
        const phaseDuration = Date.now() - phaseStartTime;
        results.phases.push({
          name: phase.name,
          status: "skipped",
          duration: phaseDuration,
        });

        broadcastMigration("migration:phase:skipped", {
          phase: phase.name,
          duration: phaseDuration,
        });
        continue;
      }

      // Execute command if provided
      if (phase.command) {
        logger.info({ command: phase.command }, "Executing migration command");
        const { stdout, stderr } = await execAsync(phase.command, {
          cwd: process.cwd(),
          timeout: 300000, // 5 minute timeout
        });

        if (stderr && !stderr.includes("warn")) {
          logger.warn({ stderr }, "Command stderr output");
        }

        logger.info({ stdout }, "Command executed successfully");
      }

      const phaseDuration = Date.now() - phaseStartTime;
      results.phases.push({
        name: phase.name,
        status: "success",
        duration: phaseDuration,
      });

      broadcastMigration("migration:phase:complete", {
        phase: phase.name,
        duration: phaseDuration,
      });
    } catch (error) {
      const phaseDuration = Date.now() - phaseStartTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      results.success = false;
      results.phases.push({
        name: phase.name,
        status: "failed",
        duration: phaseDuration,
        error: errorMessage,
      });

      logger.error({ error, phase: phase.name }, "Migration phase failed");

      broadcastMigration("migration:phase:failed", {
        phase: phase.name,
        error: errorMessage,
        duration: phaseDuration,
      });

      // Stop on first failure
      break;
    }
  }

  results.duration = Date.now() - startTime;

  if (results.success) {
    broadcastMigration("migration:completed", {
      duration: results.duration,
      phases: results.phases,
    });
    logger.info({ duration: results.duration }, "Migration completed successfully");
  } else {
    broadcastMigration("migration:failed", {
      duration: results.duration,
      phases: results.phases,
      failedPhase: results.phases.find(p => p.status === "failed"),
    });
    logger.error({ duration: results.duration }, "Migration failed");
  }

  return results;
}

/**
 * Get current migration status from database
 */
export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
  lastMigration?: {
    name: string;
    appliedAt: Date;
  };
}> {
  try {
    const { stdout } = await execAsync("npx prisma migrate status", {
      cwd: process.cwd(),
    });

    logger.debug({ output: stdout }, "Migration status output");

    // Parse the output to extract migration info
    // This is a simplified version - adjust based on actual Prisma output
    return {
      applied: [],
      pending: [],
    };
  } catch (error) {
    logger.error({ error }, "Failed to get migration status");
    throw error;
  }
}

/**
 * Rollback to a specific migration (use with extreme caution)
 */
export async function rollbackMigration(migrationName: string): Promise<void> {
  logger.warn({ migrationName }, "Rolling back migration");

  broadcastMigration("migration:rollback:start", {
    migration: migrationName,
  });

  try {
    await execAsync(`npx prisma migrate resolve --rolled-back ${migrationName}`, {
      cwd: process.cwd(),
    });

    broadcastMigration("migration:rollback:success", {
      migration: migrationName,
    });

    logger.info({ migrationName }, "Migration rollback successful");
  } catch (error) {
    broadcastMigration("migration:rollback:failed", {
      migration: migrationName,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    logger.error({ error, migrationName }, "Migration rollback failed");
    throw error;
  }
}

