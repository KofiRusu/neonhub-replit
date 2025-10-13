/**
 * Auto-Sync Enhancements Module
 * Provides auto-diagnosis, retry logic, and intelligent error handling
 */

import { execSync } from "node:child_process";
import fs from "node:fs";

export interface DiagnosticResult {
  issue: string;
  severity: "error" | "warning" | "info";
  suggestion: string;
  autoFixable: boolean;
}

/**
 * Analyze workflow logs and detect common issues
 */
export function diagnoseLogs(logContent: string): DiagnosticResult[] {
  const diagnostics: DiagnosticResult[] = [];

  // Check for missing DATABASE_URL
  if (logContent.includes("DATABASE_URL") && logContent.includes("not found")) {
    diagnostics.push({
      issue: "Missing DATABASE_URL environment variable",
      severity: "error",
      suggestion: "Add DATABASE_URL to workflow env or .env file",
      autoFixable: true
    });
  }

  // Check for Prisma client not generated
  if (logContent.includes("@prisma/client") || logContent.includes("prisma generate")) {
    diagnostics.push({
      issue: "Prisma client not generated before build",
      severity: "error",
      suggestion: "Add 'npx prisma generate' before build step",
      autoFixable: true
    });
  }

  // Check for package manager mismatch
  if (logContent.includes("pnpm") && logContent.includes("package-lock.json")) {
    diagnostics.push({
      issue: "Package manager mismatch (pnpm vs npm)",
      severity: "warning",
      suggestion: "Use npm consistently - remove pnpm references",
      autoFixable: true
    });
  }

  // Check for private repo access
  if (logContent.includes("Repository not found") || logContent.includes("remote: Repository not found")) {
    diagnostics.push({
      issue: "Cannot access private source repositories",
      severity: "error",
      suggestion: "Configure SOURCE_PAT secret with repo read permissions",
      autoFixable: false
    });
  }

  // Check for lint failures
  if (logContent.includes("@typescript-eslint/no-explicit-any")) {
    diagnostics.push({
      issue: "ESLint errors blocking build",
      severity: "warning",
      suggestion: "Fix TypeScript any types or configure CI to allow warnings",
      autoFixable: false
    });
  }

  return diagnostics;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T> | T,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, initialDelay = 1000, maxDelay = 10000, onRetry } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await Promise.resolve(fn());
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      
      if (onRetry) {
        onRetry(attempt, error);
      }

      console.warn(`[retry] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Fetch git remote with retry logic
 */
export function fetchRemoteWithRetry(remoteName: string, maxAttempts = 3): void {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      execSync(`git fetch ${remoteName} --tags --prune`, {
        stdio: "pipe",
        encoding: "utf8"
      });
      console.log(`[auto-sync] Successfully fetched from ${remoteName}`);
      return;
    } catch (error: any) {
      if (i === maxAttempts) {
        console.error(`[auto-sync] Failed to fetch ${remoteName} after ${maxAttempts} attempts`);
        throw error;
      }

      const delay = 1500 * i; // 1.5s, 3s, 4.5s
      console.warn(`[auto-sync] Fetch attempt ${i}/${maxAttempts} failed, retrying in ${delay}ms...`);
      
      // Synchronous delay
      const start = Date.now();
      while (Date.now() - start < delay) {
        // Busy wait
      }
    }
  }
}

/**
 * Check if SOURCE_PAT is configured
 */
export function assertSourcePAT(): { configured: boolean; message: string } {
  const sourceToken = process.env.SOURCE_PAT || "";
  
  if (!sourceToken) {
    return {
      configured: false,
      message: "SOURCE_PAT not set. Private source repos will fail to fetch. " +
        "Create fine-grained PAT at https://github.com/settings/personal-access-tokens/new"
    };
  }

  return {
    configured: true,
    message: "SOURCE_PAT configured correctly"
  };
}

/**
 * Build authenticated remote URL
 */
export function buildRemoteUrl(repo: string, token?: string): string {
  if (token) {
    return `https://${token}@github.com/${repo}.git`;
  }
  return `https://github.com/${repo}.git`;
}

/**
 * Detect if repository is likely private
 */
export function isLikelyPrivateRepo(repoName: string): boolean {
  // Heuristic: repos with "neon" or "neonhub" are likely private in this org
  return /neon|neonhub/i.test(repoName);
}

/**
 * Generate diagnostic report for failed run
 */
export function generateDiagnosticReport(
  runId: string,
  status: string,
  errors: DiagnosticResult[]
): string {
  const report = [
    `# Auto-Sync Diagnostic Report`,
    ``,
    `**Run ID:** ${runId}`,
    `**Status:** ${status}`,
    `**Timestamp:** ${new Date().toISOString()}`,
    ``,
    `## Issues Detected (${errors.length})`,
    ``
  ];

  errors.forEach((diag, idx) => {
    report.push(`### ${idx + 1}. ${diag.issue}`);
    report.push(`- **Severity:** ${diag.severity.toUpperCase()}`);
    report.push(`- **Suggestion:** ${diag.suggestion}`);
    report.push(`- **Auto-fixable:** ${diag.autoFixable ? "Yes" : "No (manual action required)"}`);
    report.push(``);
  });

  if (errors.length === 0) {
    report.push(`No issues detected. Workflow should succeed.`);
  }

  return report.join("\n");
}

