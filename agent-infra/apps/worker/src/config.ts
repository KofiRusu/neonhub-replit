import { config as loadEnv } from "dotenv";
import path from "node:path";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
loadEnv({ path: path.resolve(process.cwd(), envFile) });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const workerConfig = {
  redisUrl: requireEnv("REDIS_URL"),
  databaseUrl: requireEnv("DATABASE_URL"),
  concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
  metricsEnabled: process.env.METRICS_ENABLED !== "false"
};
