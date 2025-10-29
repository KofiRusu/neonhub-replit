-- CreateEnum
CREATE TYPE "MarketingCampaignType" AS ENUM ('email', 'social', 'ppc', 'content', 'seo', 'display', 'video', 'influencer', 'event', 'other');

-- CreateEnum
CREATE TYPE "MarketingCampaignStatus" AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "MarketingLeadGrade" AS ENUM ('A', 'B', 'C', 'D', 'F');

-- CreateEnum
CREATE TYPE "MarketingLeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'lost', 'unqualified');

-- CreateEnum
CREATE TYPE "MarketingTouchpointType" AS ENUM ('page_view', 'email_open', 'email_click', 'ad_impression', 'ad_click', 'social_view', 'social_click', 'form_submit', 'download', 'video_view', 'call', 'chat');

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "MarketingCampaignType" NOT NULL,
    "status" "MarketingCampaignStatus" NOT NULL DEFAULT 'draft',
    "budget" DOUBLE PRECISION,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "source" TEXT NOT NULL,
    "medium" TEXT,
    "campaign" TEXT,
    "campaignId" TEXT,
    "utmParams" JSONB,
    "score" INTEGER NOT NULL DEFAULT 0,
    "grade" "MarketingLeadGrade",
    "status" "MarketingLeadStatus" NOT NULL DEFAULT 'new',
    "firstTouch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastTouch" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "touchCount" INTEGER NOT NULL DEFAULT 1,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "convertedAt" TIMESTAMP(3),
    "convertedValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_touchpoints" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "campaignId" TEXT,
    "type" "MarketingTouchpointType" NOT NULL,
    "channel" TEXT NOT NULL,
    "url" TEXT,
    "referrer" TEXT,
    "device" TEXT,
    "location" TEXT,
    "sessionId" TEXT,
    "eventData" JSONB,
    "attributionWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadsGenerated" INTEGER NOT NULL DEFAULT 0,
    "leadsCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "channelBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_campaigns_organizationId_status_idx" ON "marketing_campaigns"("organizationId", "status");

-- CreateIndex
CREATE INDEX "marketing_campaigns_startDate_endDate_idx" ON "marketing_campaigns"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "marketing_leads_organizationId_status_idx" ON "marketing_leads"("organizationId", "status");

-- CreateIndex
CREATE INDEX "marketing_leads_email_idx" ON "marketing_leads"("email");

-- CreateIndex
CREATE INDEX "marketing_leads_source_medium_idx" ON "marketing_leads"("source", "medium");

-- CreateIndex
CREATE INDEX "marketing_leads_score_idx" ON "marketing_leads"("score");

-- CreateIndex
CREATE INDEX "marketing_touchpoints_leadId_timestamp_idx" ON "marketing_touchpoints"("leadId", "timestamp");

-- CreateIndex
CREATE INDEX "marketing_touchpoints_campaignId_idx" ON "marketing_touchpoints"("campaignId");

-- CreateIndex
CREATE INDEX "marketing_touchpoints_channel_type_idx" ON "marketing_touchpoints"("channel", "type");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_metrics_organizationId_date_key" ON "marketing_metrics"("organizationId", "date");

-- CreateIndex
CREATE INDEX "marketing_metrics_date_idx" ON "marketing_metrics"("date");

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_leads" ADD CONSTRAINT "marketing_leads_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_touchpoints" ADD CONSTRAINT "marketing_touchpoints_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "marketing_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_touchpoints" ADD CONSTRAINT "marketing_touchpoints_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
