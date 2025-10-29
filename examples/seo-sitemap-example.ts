/**
 * Example Dynamic Sitemap Implementation for Next.js 15
 * 
 * This file provides a reference implementation for Codex Agent
 * to create apps/web/src/app/sitemap.ts
 * 
 * @author Cursor Agent (Reference for Codex)
 * @date 2025-10-27
 */

import { MetadataRoute } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://neonhubecosystem.com';
  
  // ============================================================================
  // STATIC PAGES
  // ============================================================================
  
  const staticPages: MetadataRoute.Sitemap = [
    // Core pages
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Dashboard pages
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/trends`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    
    // Feature pages
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/brand-voice`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/content`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/email`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/social-media`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    
    // Account/Settings pages
    {
      url: `${baseUrl}/billing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/team`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
  
  // ============================================================================
  // DYNAMIC PAGES (From Database)
  // ============================================================================
  
  try {
    // Blog posts (if BlogPost model exists)
    // const blogPosts = await prisma.blogPost.findMany({
    //   where: { published: true },
    //   select: { slug: true, updatedAt: true }
    // });
    
    // const blogPages: MetadataRoute.Sitemap = blogPosts.map(post => ({
    //   url: `${baseUrl}/blog/${post.slug}`,
    //   lastModified: post.updatedAt,
    //   changeFrequency: 'monthly',
    //   priority: 0.6,
    // }));
    
    // Documentation pages (if docs exist)
    // const docPages = await prisma.document.findMany({
    //   where: { published: true },
    //   select: { slug: true, updatedAt: true }
    // });
    
    // const docsPages: MetadataRoute.Sitemap = docPages.map(doc => ({
    //   url: `${baseUrl}/docs/${doc.slug}`,
    //   lastModified: doc.updatedAt,
    //   changeFrequency: 'monthly',
    //   priority: 0.5,
    // }));
    
    // For now, return static pages only
    // Once Prisma models exist, uncomment database queries above
    return staticPages;
    
    // When database is ready:
    // return [...staticPages, ...blogPages, ...docsPages];
    
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Fallback: return static pages only
    return staticPages;
  }
}

// ============================================================================
// NOTES FOR CODEX AGENT
// ============================================================================

/**
 * IMPLEMENTATION CHECKLIST:
 * 
 * 1. Create file: apps/web/src/app/sitemap.ts
 * 2. Copy this code as starting point
 * 3. Adjust baseUrl if needed (check NEXT_PUBLIC_SITE_URL)
 * 4. Uncomment database queries when BlogPost/Document models exist
 * 5. Test locally: pnpm --filter apps/web dev, then visit http://localhost:3000/sitemap.xml
 * 6. Verify XML output is valid
 * 7. Update robots.txt to reference sitemap
 * 
 * VALIDATION:
 * - Sitemap should include all public pages
 * - No duplicate URLs
 * - Proper priority (homepage: 1.0, features: 0.7-0.9, content: 0.5-0.6)
 * - Change frequency realistic (daily for dashboard, monthly for blog)
 * - lastModified dates accurate (from database where possible)
 * 
 * TESTING:
 * - Validate XML: https://www.xml-sitemaps.com/validate-xml-sitemap.html
 * - Submit to Google Search Console after deployment
 * - Verify Google crawls all URLs
 */

