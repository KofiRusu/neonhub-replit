-- Extend connector kinds for Google Search Console integration
ALTER TYPE "ConnectorKind" ADD VALUE IF NOT EXISTS 'GOOGLE_SEARCH_CONSOLE';

-- Metrics captured from Google Search Console
CREATE TABLE "seo_metrics" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "contentId" TEXT,
    "url" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "ctr" DOUBLE PRECISION NOT NULL,
    "avgPosition" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "seo_metrics_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
      ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "seo_metrics_contentId_fkey"
      FOREIGN KEY ("contentId") REFERENCES "content"("id")
      ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "seo_metrics_url_date_idx" ON "seo_metrics" ("url", "date");
CREATE INDEX "seo_metrics_keyword_date_idx" ON "seo_metrics" ("keyword", "date");
CREATE INDEX "seo_metrics_org_date_idx" ON "seo_metrics" ("organizationId", "date");
CREATE UNIQUE INDEX "seo_metrics_org_url_keyword_date_key" ON "seo_metrics" ("organizationId", "url", "keyword", "date");
