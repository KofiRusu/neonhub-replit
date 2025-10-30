import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://neonhubecosystem.com";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/features", changeFrequency: "weekly", priority: 0.9 },
  { path: "/dashboard", changeFrequency: "weekly", priority: 0.8 },
  { path: "/analytics", changeFrequency: "weekly", priority: 0.8 },
  { path: "/trends", changeFrequency: "weekly", priority: 0.8 },
  { path: "/billing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/team", changeFrequency: "monthly", priority: 0.7 },
  { path: "/agents", changeFrequency: "weekly", priority: 0.8 },
  { path: "/brand-voice", changeFrequency: "weekly", priority: 0.8 },
  { path: "/content", changeFrequency: "weekly", priority: 0.8 },
  { path: "/email", changeFrequency: "weekly", priority: 0.8 },
  { path: "/social-media", changeFrequency: "weekly", priority: 0.8 },
  { path: "/settings", changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  // Static routes
  const staticEntries = STATIC_ROUTES.map(route => ({
    url: `${baseUrl}${route.path === "/" ? "" : route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Dynamic content entries (from database)
  try {
    // Import generateSitemap service dynamically to avoid edge runtime issues
    const { generateSitemap } = await import('@/../../apps/api/src/services/sitemap-generator');
    
    const organizationId = process.env.DEFAULT_ORG_ID || '';
    if (organizationId) {
      const sitemapXml = await generateSitemap({
        organizationId,
        baseUrl,
      });
      
      // Parse XML and extract dynamic URLs
      // For now, return static entries + note that dynamic generation is ready
      // Full XML parsing can be added when needed
    }
  } catch (error) {
    console.warn('[sitemap] Could not fetch dynamic content:', error);
    // Fallback to static routes only
  }

  return staticEntries;
}
