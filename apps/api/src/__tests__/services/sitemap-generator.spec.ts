import { describe, it, expect, beforeEach } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import {
  generateSitemap,
  generateRobotsTxt,
  generateSitemapIndex,
} from "../../services/sitemap-generator.js";

type PrismaStub = {
  content: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

function createPrismaStub(): PrismaStub & PrismaClient {
  return {
    content: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  } as unknown as PrismaStub & PrismaClient;
}

describe("sitemap-generator", () => {
  let prisma: PrismaStub & PrismaClient;

  beforeEach(() => {
    prisma = createPrismaStub();
  });

  it("produces an XML sitemap containing static and dynamic entries", async () => {
    prisma.content.findMany.mockResolvedValue([
      {
        id: "content-1",
        metadata: { slug: "neon-marketing-guide" },
        updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        publishedAt: new Date("2024-12-31T00:00:00.000Z"),
        createdAt: new Date("2024-12-01T00:00:00.000Z"),
      },
      {
        id: "content-2",
        metadata: null,
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        publishedAt: null,
        createdAt: new Date("2024-11-15T00:00:00.000Z"),
      },
    ]);

    const xml = await generateSitemap({
      organizationId: "org-123",
      baseUrl: "https://example.com",
      prisma,
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://example.com/");
    expect(xml).toContain("https://example.com/content/neon-marketing-guide");
    expect(xml).toContain("https://example.com/content/content-2");
    expect(xml).toContain("<changefreq>weekly</changefreq>");
    expect(prisma.content.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-123", status: "published" }),
      }),
    );
  });

  it("falls back to sitemap index when content exceeds limit", async () => {
    prisma.content.count.mockResolvedValue(180000);

    const xml = await generateSitemapIndex({
      organizationId: "org-456",
      baseUrl: "https://example.com",
      prisma,
    });

    expect(xml).toContain("<sitemapindex");
    expect(xml.match(/<sitemap>/g)).toHaveLength(4); // 180k -> 4 sitemaps
    expect(prisma.content.count).toHaveBeenCalled();
  });

  it("generates robots.txt referencing the API sitemap", () => {
    const robots = generateRobotsTxt("https://example.com");
    expect(robots).toContain("User-agent: *");
    expect(robots).toContain("Sitemap: https://example.com/api/sitemap.xml");
    expect(robots).toContain("Disallow: /api/internal/");
  });
});
