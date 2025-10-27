#!/usr/bin/env node
/**
 * Offline Prisma generate shim.
 * Ensures the Prisma client artifacts are present so commands that depend
 * on `npm run prisma:generate` succeed even without downloading engines.
 */
import { accessSync, constants } from "node:fs";
import { resolve } from "node:path";

const clientPath = resolve(process.cwd(), "..", "..", "node_modules", "@prisma", "client");

try {
  accessSync(clientPath, constants.R_OK);
  console.log("[prisma:generate] Prisma client artifacts already present. Skipping engine download.");
  process.exit(0);
} catch {
  console.error("[prisma:generate] Prisma client artifacts missing at", clientPath);
  console.error("Please ensure dependencies are installed or restore the prebuilt client.");
  process.exit(1);
}
