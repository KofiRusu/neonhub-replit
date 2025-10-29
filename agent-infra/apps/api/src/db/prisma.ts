import { PrismaClient } from "@prisma/client";
import { appConfig } from "../config.js";
import { logger } from "../lib/logger.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: appConfig.nodeEnv === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (appConfig.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export async function assertDatabaseConnection(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info("Database connection verified");
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    throw error;
  }
}
