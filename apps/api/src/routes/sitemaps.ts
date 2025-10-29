import { Router } from "express";
import { generateSitemap, generateRobotsTxt } from "../services/sitemap-generator.js";
import { logger } from "../lib/logger.js";

type CacheEntry = {
  xml: string;
  expiresAt: number;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const sitemapCache = new Map<string, CacheEntry>();

function buildCacheKey(organizationId: string): string {
  return `sitemap:${organizationId}`;
}

function getCachedSitemap(organizationId: string): CacheEntry | null {
  const entry = sitemapCache.get(buildCacheKey(organizationId));
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    sitemapCache.delete(buildCacheKey(organizationId));
    return null;
  }
  return entry;
}

function setSitemapCache(organizationId: string, xml: string): void {
  sitemapCache.set(buildCacheKey(organizationId), { xml, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateSitemapCache(organizationId: string): void {
  sitemapCache.delete(buildCacheKey(organizationId));
}

export const sitemapsRouter: Router = Router();

sitemapsRouter.get("/sitemap.xml", async (req, res) => {
  const organizationId =
    (typeof req.query.orgId === "string" && req.query.orgId.trim()) ||
    (typeof req.query.organizationId === "string" && req.query.organizationId.trim()) ||
    "default";

  try {
    const cached = getCachedSitemap(organizationId);
    if (cached) {
      res.setHeader("Content-Type", "application/xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.xml);
    }

    const xml = await generateSitemap({ organizationId });
    setSitemapCache(organizationId, xml);

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("X-Cache", "MISS");
    res.send(xml);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate sitemap";
    logger.error({ error, organizationId }, "[sitemaps] Failed to generate sitemap");
    res
      .status(500)
      .send(`<?xml version="1.0" encoding="UTF-8"?><error>${message.replace(/"/g, "")}</error>`);
  }
});

sitemapsRouter.get("/robots.txt", (req, res) => {
  try {
    const robotsTxt = generateRobotsTxt();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(robotsTxt);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate robots.txt";
    logger.error({ error }, "[sitemaps] Failed to generate robots.txt");
    res.status(500).send(`User-agent: *\nDisallow: /\n# ${message}`);
  }
});

sitemapsRouter.post("/sitemap/invalidate", (req, res) => {
  const organizationId =
    (typeof req.body?.organizationId === "string" && req.body.organizationId.trim()) || "default";

  invalidateSitemapCache(organizationId);
  res.json({ success: true, message: "Sitemap cache invalidated" });
});
