#!/usr/bin/env node
/**
 * Offline environment verifier.
 * Lists required environment variable names and reports their presence without revealing values.
 */

import fs from "fs";
import path from "path";

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

const envFiles = [".env", ".env.local", "apps/api/.env", "apps/web/.env"];
const presentFiles = envFiles.filter((file) =>
  fs.existsSync(path.join(process.cwd(), file))
);

if (presentFiles.length) {
  console.log(
    `${BOLD}Detected environment files:${RESET} ${presentFiles.join(", ")}`
  );
} else {
  console.log(
    `${BOLD}No environment files detected.${RESET} Proceeding with process env inspection only.`
  );
}

console.log("\n" + `${BOLD}Required Environment Keys${RESET}`);
console.log("--------------------------------");

let missingCount = 0;

for (const key of REQUIRED_KEYS) {
  const present = Boolean(process.env[key]);
  const status = present ? `${GREEN}OK${RESET}` : `${RED}MISSING${RESET}`;
  if (!present) {
    missingCount += 1;
  }
  console.log(`${status}  ${key}`);
}

if (missingCount > 0) {
  console.log(
    `\n${RED}${missingCount} key(s) missing.${RESET} Populate the placeholders before enabling live services.`
  );
  process.exitCode = 1;
} else {
  console.log(`\n${GREEN}All required keys are present.${RESET}`);
}
