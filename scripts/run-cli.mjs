#!/usr/bin/env node
/**
 * Helper to execute workspace CLIs (prisma, next, tsc, etc.) reliably.
 * Resolves the binary from the monorepo root so individual packages
 * do not depend on local node_modules/.bin symlinks.
 */

import { spawn } from "node:child_process";
import { mkdirSync, accessSync, constants } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoRoot = resolve(__dirname, "..");

const MANUAL_BIN = {
  prisma: resolve(repoRoot, "node_modules/prisma/build/index.js"),
  next: resolve(repoRoot, "node_modules/next/dist/bin/next"),
  tsc: resolve(repoRoot, "node_modules/typescript/bin/tsc"),
  eslint: resolve(repoRoot, "node_modules/eslint/bin/eslint.js"),
  playwright: resolve(repoRoot, "node_modules/@playwright/test/cli.js"),
  jest: resolve(repoRoot, "node_modules/jest/bin/jest.js"),
  tsx: resolve(repoRoot, "node_modules/tsx/dist/cli.mjs"),
  prettier: resolve(repoRoot, "node_modules/prettier/bin-prettier.js"),
};

const BIN_MAP = {
  prisma: "prisma/build/index.js",
  next: "next/dist/bin/next",
  tsc: "typescript/bin/tsc",
  eslint: "eslint/bin/eslint.js",
  playwright: "@playwright/test/cli.js",
  jest: "jest/bin/jest.js",
  tsx: "tsx/cli",
  prettier: "prettier/bin-prettier.js",
};

function resolveBinary(command) {
  const modulePath = BIN_MAP[command];
  if (!modulePath) {
    throw new Error(
      `Unsupported command "${command}". Update BIN_MAP in scripts/run-cli.mjs.`,
    );
  }

  try {
    try {
      return require.resolve(modulePath, { paths: [__dirname] });
    } catch (error) {
      const manual = MANUAL_BIN[command];
      if (manual) {
        try {
          accessSync(manual, constants.X_OK | constants.R_OK);
          return manual;
        } catch {
          // fall through to throw original error
        }
      }
      throw error;
    }
  } catch (error) {
    throw new Error(
      `Unable to resolve binary for "${command}" (module "${modulePath}"). Did you install dependencies?`,
      { cause: error },
    );
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.error("Usage: node scripts/run-cli.mjs <command> [...args]");
    process.exit(1);
  }

  let binary;
  try {
    binary = resolveBinary(command);
  } catch (error) {
    console.error(error.message);
    if (error.cause) {
      console.error(error.cause);
    }
    process.exit(1);
  }

  const env = { ...process.env, NODE_NO_WARNINGS: process.env.NODE_NO_WARNINGS ?? "1" };

  if (command === "prisma") {
    const repoRoot = resolve(__dirname, "..");
    const enginesDir = resolve(repoRoot, ".cache/prisma-engines");
    const homeDir = resolve(repoRoot, ".cache/prisma-home");
    try {
      mkdirSync(enginesDir, { recursive: true });
    } catch {
      // noop; directory may already exist or be read-only
    }
    try {
      mkdirSync(homeDir, { recursive: true });
    } catch {
      // ignore
    }
    env.PRISMA_ENGINES_DIR ??= enginesDir;
    env.PRISMA_ENGINES_CACHE_DIR ??= enginesDir;
    env.PRISMA_ENGINE_CACHE_DIR ??= enginesDir;
    env.PRISMA_CLIENT_ENGINE_TYPE ??= "binary";
    env.HOME = homeDir;
  }

  const child = spawn(process.execPath, [binary, ...args], {
    stdio: "inherit",
    cwd: process.cwd(),
    env,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

main();
