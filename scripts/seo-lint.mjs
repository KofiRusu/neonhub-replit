#!/usr/bin/env node
/**
 * Basic SEO linting script for NeonHub web app.
 *
 * Checks for:
 *  - Presence of robots.txt and sitemap.xml in the public directory.
 *  - Metadata exports in Next.js route segments (page.tsx / page.ts).
 *
 * Extend this script as automation matures (structured data validation,
 * meta length checks, etc.).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const webRoot = path.join(projectRoot, "apps", "web");
const publicDir = path.join(webRoot, "public");
const appDir = path.join(webRoot, "src", "app");

const issues = [];

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function assertFile(relPath, severity, message) {
  const absolute = path.join(projectRoot, relPath);
  if (!(await pathExists(absolute))) {
    issues.push({ severity, message: `${message} (${relPath})` });
  }
}

async function collectPageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPageFiles(fullPath)));
    } else if (entry.isFile()) {
      const isPageFile =
        entry.name === "page.tsx" ||
        entry.name === "page.ts" ||
        entry.name === "page.jsx" ||
        entry.name === "page.js";
      if (isPageFile) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function lintMetadata() {
  const exists = await pathExists(appDir);
  if (!exists) {
    issues.push({
      severity: "error",
      message: `Next.js app directory not found at ${path.relative(projectRoot, appDir)}`
    });
    return;
  }

  const pageFiles = await collectPageFiles(appDir);
  for (const filePath of pageFiles) {
    const content = await fs.readFile(filePath, "utf8");
    const hasMetadataExport =
      content.includes("export const metadata") ||
      content.includes("export const generateMetadata") ||
      content.includes("Head(") ||
      content.includes("default function Head");

    if (!hasMetadataExport) {
      issues.push({
        severity: "warn",
        message: `No metadata export found in ${path.relative(projectRoot, filePath)}`
      });
    }
  }
}

async function main() {
  await assertFile(path.relative(projectRoot, path.join(publicDir, "robots.txt")), "error", "robots.txt missing");

  const staticSitemap = await pathExists(path.join(publicDir, "sitemap.xml"));
  const dynamicSitemapTs = await pathExists(path.join(appDir, "sitemap.ts"));
  const dynamicSitemapTsx = await pathExists(path.join(appDir, "sitemap.tsx"));

  if (!staticSitemap && !dynamicSitemapTs && !dynamicSitemapTsx) {
    issues.push({
      severity: "warn",
      message: "No sitemap detected (expected apps/web/public/sitemap.xml or apps/web/src/app/sitemap.ts[x])"
    });
  }

  await lintMetadata();

  if (issues.length === 0) {
    console.log("✅ SEO lint passed: no issues detected.");
    return;
  }

  const errorCount = issues.filter(issue => issue.severity === "error").length;
  const warnCount = issues.filter(issue => issue.severity === "warn").length;

  for (const issue of issues) {
    const label = issue.severity === "error" ? "ERROR" : "WARN";
    console.log(`[${label}] ${issue.message}`);
  }

  console.log(
    `\nSummary: ${errorCount} error(s), ${warnCount} warning(s). ` +
      "Warnings should be triaged; errors must block deployment."
  );

  if (errorCount > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("❌ SEO lint failed unexpectedly:", error);
  process.exitCode = 1;
});
