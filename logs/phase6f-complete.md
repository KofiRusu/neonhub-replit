# Phase 6F – Analytics Loop (Google Search Console)

- Added Prisma SEOMetric model and migration, plus extended ConnectorKind for Google Search Console integrations.
- Registered Google Search Console connector with OAuth metadata and job scheduler for daily analytics sync.
- Implemented fetchGSCMetrics integration, SEO learning services, and tRPC endpoints for metrics, trends, underperformers, and optimisation triggers.
- Introduced upsert helper for search console metrics and recorded tests for integration + learning services (coverage gating still enforced globally).
- Pending: wire content publish workflows to invalidate sitemap cache and address global 95% coverage threshold before CI.
