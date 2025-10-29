import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../db/prisma.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export interface GenerateSitemapOptions {
  organizationId: string;
  baseUrl?: string;
  prisma?: PrismaClient;
}

export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

const STATIC_ROUTES: Array<{ path: string; changefreq: SitemapEntry["changefreq"]; priority: number }> = [
  { path: "/", changefreq: "daily", priority: 1 },
  { path: "/dashboard", changefreq: "daily", priority: 0.9 },
  { path: "/dashboard/seo", changefreq: "daily", priority: 0.85 },
  { path: "/dashboard/seo/keywords", changefreq: "weekly", priority: 0.8 },
  { path: "/dashboard/seo/content", changefreq: "weekly", priority: 0.8 },
  { path: "/dashboard/seo/links", changefreq: "weekly", priority: 0.75 },
  { path: "/dashboard/seo/trends", changefreq: "weekly", priority: 0.75 },
];

function sanitiseBaseUrl(raw?: string): string {
  const url = (raw ?? process.env.PUBLIC_URL ?? env.NEXTAUTH_URL ?? "https://neonhubecosystem.com").trim();
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildContentPath(metadata: Record<string, unknown> | null | undefined, id: string): string {
  const slugCandidate =
    (metadata && typeof metadata === "object" && typeof (metadata as Record<string, unknown>).slug === "string"
      ? ((metadata as Record<string, unknown>).slug as string)
      : null) ||
    (metadata && typeof metadata === "object" && typeof (metadata as Record<string, unknown>).path === "string"
      ? ((metadata as Record<string, unknown>).path as string)
      : null);

  if (slugCandidate) {
    return slugCandidate.startsWith("/") ? slugCandidate : `/content/${slugCandidate}`;
  }

  return `/content/${id}`;
}

export async function generateSitemap({
  organizationId,
  baseUrl,
  prisma = defaultPrisma,
}: GenerateSitemapOptions): Promise<string> {
  const resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
  logger.info({ organizationId }, "[sitemap-generator] Building sitemap");

  const content = await prisma.content.findMany({
    where: {
      organizationId,
      status: "published",
    },
    select: {
      id: true,
      metadata: true,
      updatedAt: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  logger.info({ organizationId, contentCount: content.length }, "[sitemap-generator] Content collected");

  const nowIso = new Date().toISOString();

  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    loc: `${resolvedBaseUrl}${route.path}`,
    lastmod: nowIso,
    changefreq: route.changefreq,
    priority: route.priority,
  }));

  const dynamicEntries: SitemapEntry[] = content.map((item) => {
    const metadata = item.metadata as Record<string, unknown> | null | undefined;
    const path = buildContentPath(metadata, item.id);
    const lastUpdated = item.updatedAt ?? item.publishedAt ?? item.createdAt ?? new Date();

    return {
      loc: `${resolvedBaseUrl}${path.startsWith("/") ? "" : "/"}${path}`,
      lastmod: lastUpdated.toISOString(),
      changefreq: "weekly",
      priority: 0.8,
    };
  });

  const entries = [...staticEntries, ...dynamicEntries];

  const urlsXml = entries
    .map(
      (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  logger.info({ organizationId, entryCount: entries.length }, "[sitemap-generator] Sitemap generated");

  return xml;
}

export async function countContentItems(organizationId: string, prisma: PrismaClient = defaultPrisma): Promise<number> {
  return prisma.content.count({
    where: {
      organizationId,
      status: "published",
    },
  });
}

export async function generateSitemapIndex({
  organizationId,
  baseUrl,
  prisma = defaultPrisma,
}: GenerateSitemapOptions): Promise<string> {
  const resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
  const total = await countContentItems(organizationId, prisma);
  const sitemapCount = Math.ceil(total / 50_000);

  if (sitemapCount <= 1) {
    return generateSitemap({ organizationId, baseUrl: resolvedBaseUrl, prisma });
  }

  const nowIso = new Date().toISOString();
  const indexEntries = Array.from({ length: sitemapCount }, (_, idx) => `  <sitemap>
    <loc>${resolvedBaseUrl}/api/sitemap-${idx + 1}.xml</loc>
    <lastmod>${nowIso}</lastmod>
  </sitemap>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries}
</sitemapindex>`;
}

export function generateRobotsTxt(baseUrl?: string): string {
  const resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
  return `User-agent: *
Allow: /

# Sitemap reference
Sitemap: ${resolvedBaseUrl}/api/sitemap.xml

# Restricted paths
Disallow: /api/internal/
Disallow: /admin/

# Crawl etiquette
Crawl-delay: 1`;
}
