#!/usr/bin/env node
/**
 * SEO baseline audit script.
 *
 * Usage: npm run seo:audit -- --base-url=https://neonhubecosystem.com
 * Default base URL: http://localhost:3000
 *
 * Requirements: target site must expose /sitemap.xml.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const reportsDir = path.join(projectRoot, "reports", "seo-audit");

const args = process.argv.slice(2);
const baseArg = args.find(arg => arg.startsWith("--base-url="));
const baseUrl = (baseArg ? baseArg.split("=")[1] : process.env.SEO_AUDIT_BASE_URL) ?? "http://localhost:3000";

function normaliseBase(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function extractTagContent(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaContent(html, name) {
  const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*content=["']([^"']+)["'][^>]*>`, "i");
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractCanonical(html) {
  const regex = /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i;
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMatches(html, tag) {
  const regex = new RegExp(`<${tag}[^>]*>`, "gi");
  return html.match(regex) ?? [];
}

function countImagesMissingAlt(html) {
  const regex = /<img [^>]*>/gi;
  const tags = html.match(regex) ?? [];
  let missing = 0;
  for (const tag of tags) {
    if (!/alt=("|')[^"']*("|')/i.test(tag)) {
      missing += 1;
    }
  }
  return missing;
}

function extractInternalLinks(html, base) {
  const linkRegex = /<a [^>]*href=["']([^"']+)["'][^>]*>/gi;
  const links = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }

  const origin = new URL(base);
  return links.filter(link => {
    if (link.startsWith("http://") || link.startsWith("https://")) {
      try {
        const url = new URL(link);
        return url.origin === origin.origin;
      } catch {
        return false;
      }
    }
    return link.startsWith("/");
  });
}

async function fetchText(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function parseSitemap(xml) {
  const locRegex = /<loc>(.*?)<\/loc>/gi;
  const urls = [];
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function evaluateTitle(title) {
  if (!title) return { status: "error", message: "Missing title tag" };
  const length = title.length;
  if (length < 30) return { status: "warn", message: `Title too short (${length} chars)` };
  if (length > 65) return { status: "warn", message: `Title too long (${length} chars)` };
  return { status: "ok", message: `Title length ${length} chars` };
}

function evaluateDescription(description) {
  if (!description) return { status: "warn", message: "Missing meta description" };
  const length = description.length;
  if (length < 130) return { status: "warn", message: `Description short (${length} chars)` };
  if (length > 170) return { status: "warn", message: `Description long (${length} chars)` };
  if (length < 150 || length > 160) {
    return { status: "info", message: `Description ${length} chars (target 150-160)` };
  }
  return { status: "ok", message: `Description length ${length} chars` };
}

function evaluateHeadings(html) {
  const h1s = extractMatches(html, "h1");
  const issues = [];
  if (h1s.length === 0) {
    issues.push({ status: "warn", message: "No H1 found" });
  } else if (h1s.length > 1) {
    issues.push({ status: "warn", message: `Multiple H1 tags (${h1s.length})` });
  } else {
    issues.push({ status: "ok", message: "Single H1 present" });
  }
  const h2s = extractMatches(html, "h2").length;
  const h3s = extractMatches(html, "h3").length;
  return { issues, counts: { h1: h1s.length, h2: h2s, h3: h3s } };
}

async function ensureReportDir() {
  await fs.mkdir(reportsDir, { recursive: true });
}

async function writeReport(data) {
  await ensureReportDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(reportsDir, `seo-audit-${timestamp}.json`);
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf8");
  return jsonPath;
}

async function mainAudit() {
  const normalisedBase = normaliseBase(baseUrl);
  const sitemapUrl = `${normalisedBase}/sitemap.xml`;
  console.log(`🔍 Fetching sitemap from ${sitemapUrl}`);

  const sitemapResponse = await fetchText(sitemapUrl);
  if (typeof sitemapResponse !== "string") {
    console.error("❌ Failed to retrieve sitemap:", sitemapResponse.error);
    process.exitCode = 1;
    return;
  }

  const urls = parseSitemap(sitemapResponse);
  if (urls.length === 0) {
    console.error("❌ No URLs found in sitemap.");
    process.exitCode = 1;
    return;
  }

  console.log(`✅ Found ${urls.length} URL(s) to audit.`);

  const results = [];

  for (const url of urls) {
    const response = await fetchText(url);
    if (typeof response !== "string") {
      results.push({
        url,
        status: "error",
        message: `Unable to fetch page: ${response.error}`
      });
      continue;
    }

    const title = extractTagContent(response, "title");
    const description = extractMetaContent(response, "description");
    const canonical = extractCanonical(response);
    const internalLinks = extractInternalLinks(response, normalisedBase);
    const imagesMissingAlt = countImagesMissingAlt(response);
    const headingInfo = evaluateHeadings(response);

    const titleEval = evaluateTitle(title);
    const descEval = evaluateDescription(description);

    const issues = [
      titleEval,
      descEval,
      { status: canonical ? "ok" : "warn", message: canonical ? "Canonical tag present" : "Missing canonical tag" },
      {
        status: imagesMissingAlt === 0 ? "ok" : "warn",
        message: imagesMissingAlt === 0 ? "All images have alt text" : `${imagesMissingAlt} image(s) missing alt text`
      },
      ...headingInfo.issues
    ];

    results.push({
      url,
      title,
      description,
      canonical,
      headingCounts: headingInfo.counts,
      internalLinkCount: internalLinks.length,
      issues
    });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: normalisedBase,
    pages: results,
    coreWebVitals: {
      status: "skipped",
      message: "Run Lighthouse CI (see .github/workflows/seo-checks.yml) for CWV metrics."
    }
  };

  const reportPath = await writeReport(report);

  const summaryLines = [];
  for (const page of results) {
    const warnings = page.issues.filter(issue => issue.status === "warn");
    const errors = page.issues.filter(issue => issue.status === "error");
    summaryLines.push(
      `- ${page.url}\n  - ✅ ${page.title ?? "No title"}\n` +
        warnings.map(w => `  - ⚠️ ${w.message}`).join("\n") +
        (warnings.length && errors.length ? "\n" : "") +
        errors.map(e => `  - ❌ ${e.message}`).join("\n")
    );
  }

  const summary = [
    `SEO Baseline Audit (base: ${normalisedBase})`,
    `Report saved to: ${reportPath}`,
    "",
    summaryLines.join("\n")
  ].join("\n");

  console.log(summary);
}

mainAudit().catch(error => {
  console.error("Unexpected failure:", error);
  process.exitCode = 1;
});
