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
  const lastModified = new Date().toISOString();

  // TODO: once database access is restored, extend this function to include
  // dynamic entries (blog posts, documentation) sourced via Prisma.

  return STATIC_ROUTES.map(route => ({
    url: `${baseUrl}${route.path === "/" ? "" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
