/**
 * Main tRPC Router
 * Combines all sub-routers into the application router
 */

import { createTRPCRouter } from "./trpc.js";
import { agentsRouter } from "./routers/agents.router.js";
import { seoRouter } from "./routers/seo.router.js";
import { brandRouter } from "./routers/brand.router.js";
import { contentRouter } from "./routers/content.router.js";
import { trendsRouter } from "./routers/trends.router.js";

/**
 * Application router
 * All tRPC procedures are namespaced under their respective routers
 */
export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  seo: seoRouter,
  brand: brandRouter,
  content: contentRouter,
  trends: trendsRouter,
  // Additional routers will be added here:
  // campaigns: campaignsRouter,
  // marketing: marketingRouter,
  // orchestration: orchestrationRouter,
});

// Export type definition for use in frontend
export type AppRouter = typeof appRouter;
