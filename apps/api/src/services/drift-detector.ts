import { exec } from "child_process";
import { promisify } from "util";
import { prisma } from "../db/prisma.js";
import { broadcastMigration } from "../ws/index.js";
import { logger } from "../lib/logger.js";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

interface SchemaDrift {
  detected: boolean;
  drifts: Array<{
    type: "added" | "removed" | "modified";
    table: string;
    column?: string;
    details: string;
  }>;
  timestamp: Date;
}

interface DatabaseColumn {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

/**
 * Detect schema drift by comparing database structure with Prisma schema
 */
export async function detectDrift(): Promise<SchemaDrift> {
  logger.info("Starting drift detection");

  const drift: SchemaDrift = {
    detected: false,
    drifts: [],
    timestamp: new Date(),
  };

  try {
    // Get current database schema
    const dbColumns = await prisma.$queryRaw<DatabaseColumn[]>`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `;

    logger.debug({ columnCount: dbColumns.length }, "Retrieved database columns");

    // Run prisma db pull to generate a temporary schema
    const tempSchemaPath = path.join(process.cwd(), "prisma", "schema.temp.prisma");
    
    try {
      await execAsync("npx prisma db pull --schema=prisma/schema.temp.prisma", {
        cwd: process.cwd(),
        timeout: 60000,
      });

      // Compare the temp schema with the actual schema
      const actualSchema = await fs.readFile(
        path.join(process.cwd(), "prisma", "schema.prisma"),
        "utf-8"
      );
      const pulledSchema = await fs.readFile(tempSchemaPath, "utf-8");

      // Simple diff detection (enhanced version would parse AST)
      if (actualSchema !== pulledSchema) {
        drift.detected = true;

        // Parse differences (simplified)
        const actualModels = extractModelNames(actualSchema);
        const pulledModels = extractModelNames(pulledSchema);

        // Check for added tables
        for (const model of pulledModels) {
          if (!actualModels.includes(model)) {
            drift.drifts.push({
              type: "added",
              table: model,
              details: `Table ${model} exists in database but not in schema`,
            });
          }
        }

        // Check for removed tables
        for (const model of actualModels) {
          if (!pulledModels.includes(model)) {
            drift.drifts.push({
              type: "removed",
              table: model,
              details: `Table ${model} exists in schema but not in database`,
            });
          }
        }
      }

      // Clean up temp schema
      await fs.unlink(tempSchemaPath).catch(() => {
        // Ignore cleanup errors
      });
    } catch (error) {
      logger.error({ error }, "Failed to pull database schema");
    }

    if (drift.detected) {
      logger.warn({ drifts: drift.drifts }, "Schema drift detected");

      broadcastMigration("drift:detected", {
        driftCount: drift.drifts.length,
        drifts: drift.drifts,
        timestamp: drift.timestamp,
      });

      // Log to audit trail
      await logDriftEvent(drift);
    } else {
      logger.info("No schema drift detected");
    }
  } catch (error) {
    logger.error({ error }, "Drift detection failed");
    throw error;
  }

  return drift;
}

/**
 * Extract model names from Prisma schema file
 */
function extractModelNames(schema: string): string[] {
  const modelRegex = /model\s+(\w+)\s*{/g;
  const models: string[] = [];
  let match;

  while ((match = modelRegex.exec(schema)) !== null) {
    models.push(match[1]);
  }

  return models;
}

/**
 * Log drift event to database for audit trail
 */
async function logDriftEvent(drift: SchemaDrift): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: "schema_drift_detected",
        metadata: {
          driftCount: drift.drifts.length,
          drifts: drift.drifts,
          timestamp: drift.timestamp,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to log drift event");
  }
}

/**
 * Start continuous drift monitoring (runs every 5 minutes)
 */
export function startDriftMonitoring(intervalMs: number = 300000): NodeJS.Timeout {
  logger.info({ intervalMs }, "Starting drift monitoring");

  const monitor = async () => {
    try {
      await detectDrift();
    } catch (error) {
      logger.error({ error }, "Drift monitoring cycle failed");
    }
  };

  // Run immediately
  monitor();

  // Then schedule recurring checks
  return setInterval(monitor, intervalMs);
}

/**
 * Generate a corrective migration for detected drift
 */
export async function generateCorrectiveMigration(
  drift: SchemaDrift
): Promise<string | null> {
  if (!drift.detected || drift.drifts.length === 0) {
    return null;
  }

  logger.info({ driftCount: drift.drifts.length }, "Generating corrective migration");

  try {
    const migrationName = `fix_drift_${Date.now()}`;

    // This would create a new migration based on the current schema
    await execAsync(`npx prisma migrate dev --name ${migrationName} --create-only`, {
      cwd: process.cwd(),
      timeout: 60000,
    });

    logger.info({ migrationName }, "Corrective migration generated");

    return migrationName;
  } catch (error) {
    logger.error({ error }, "Failed to generate corrective migration");
    throw error;
  }
}

/**
 * Get drift detection history from audit logs
 */
export async function getDriftHistory(limit: number = 10): Promise<SchemaDrift[]> {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: "schema_drift_detected",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return logs.map(log => ({
      detected: true,
      drifts: (log.metadata as any).drifts || [],
      timestamp: log.createdAt,
    }));
  } catch (error) {
    logger.error({ error }, "Failed to get drift history");
    return [];
  }
}

