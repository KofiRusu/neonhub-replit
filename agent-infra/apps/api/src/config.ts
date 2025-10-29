import { config as loadEnv } from "dotenv";
import path from "node:path";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
loadEnv({ path: path.resolve(process.cwd(), envFile) });

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const appConfig = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: requireEnv("DATABASE_URL"),
  redisUrl: requireEnv("REDIS_URL"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  metricsEnabled: process.env.METRICS_ENABLED !== "false"
};
