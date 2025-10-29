-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('granted', 'revoked', 'denied', 'pending');

-- CreateEnum
CREATE TYPE "BudgetAllocationStatus" AS ENUM ('planned', 'approved', 'executing', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "externalId" TEXT,
    "displayName" TEXT,
    "primaryEmail" TEXT,
    "primaryPhone" TEXT,
    "primaryHandle" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "personaTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attributes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_identities" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" CITEXT NOT NULL,
    "channel" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_consents" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "channel" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'granted',
    "source" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "evidence" JSONB,
    "metadata" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "campaignId" TEXT,
    "objectiveId" TEXT,
    "channel" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "providerId" TEXT,
    "topic" TEXT,
    "intent" TEXT,
    "sentiment" TEXT,
    "payload" JSONB,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibility" TEXT NOT NULL DEFAULT 'internal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mem_embeddings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "label" TEXT,
    "embedding" vector,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "mem_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_topics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trend" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_objectives" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "successMetric" TEXT,
    "targetValue" DOUBLE PRECISION,
    "dueAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_profiles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "totalBudget" DOUBLE PRECISION,
    "reserved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "constraints" JSONB,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "budgetProfileId" TEXT NOT NULL,
    "campaignId" TEXT,
    "objectiveId" TEXT,
    "channel" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "status" "BudgetAllocationStatus" NOT NULL DEFAULT 'planned',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_ledger" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "budgetProfileId" TEXT NOT NULL,
    "allocationId" TEXT,
    "campaignId" TEXT,
    "personId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "budget_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "budgetProfileId" TEXT,
    "stripePaymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "customerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "budgetProfileId" TEXT,
    "partnerId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "status" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snippet_library" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "brandId" TEXT,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tone" TEXT,
    "useCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "winRate" DOUBLE PRECISION,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastWonAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snippet_library_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_organizationId_externalId_key" ON "people"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "people_organizationId_primaryEmail_idx" ON "people"("organizationId", "primaryEmail");

-- CreateIndex
CREATE INDEX "people_organizationId_primaryPhone_idx" ON "people"("organizationId", "primaryPhone");

-- CreateIndex
CREATE INDEX "people_organizationId_lastSeenAt_idx" ON "people"("organizationId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "person_identities_organizationId_type_value_key" ON "person_identities"("organizationId", "type", "value");

-- CreateIndex
CREATE INDEX "person_identities_personId_type_idx" ON "person_identities"("personId", "type");

-- CreateIndex
CREATE INDEX "person_consents_personId_channel_idx" ON "person_consents"("personId", "channel");

-- CreateIndex
CREATE INDEX "person_consents_organizationId_channel_idx" ON "person_consents"("organizationId", "channel");

-- CreateIndex
CREATE INDEX "events_organizationId_occurredAt_idx" ON "events"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "events_personId_occurredAt_idx" ON "events"("personId", "occurredAt");

-- CreateIndex
CREATE INDEX "events_organizationId_channel_type_idx" ON "events"("organizationId", "channel", "type");

-- CreateIndex
CREATE INDEX "person_notes_personId_createdAt_idx" ON "person_notes"("personId", "createdAt");

-- CreateIndex
CREATE INDEX "person_notes_organizationId_idx" ON "person_notes"("organizationId");

-- CreateIndex
CREATE INDEX "mem_embeddings_personId_createdAt_idx" ON "mem_embeddings"("personId", "createdAt");

-- CreateIndex
CREATE INDEX "mem_embeddings_organizationId_idx" ON "mem_embeddings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "person_topics_personId_name_key" ON "person_topics"("personId", "name");

-- CreateIndex
CREATE INDEX "person_topics_organizationId_name_idx" ON "person_topics"("organizationId", "name");

-- CreateIndex
CREATE INDEX "person_objectives_organizationId_status_idx" ON "person_objectives"("organizationId", "status");

-- CreateIndex
CREATE INDEX "person_objectives_personId_status_idx" ON "person_objectives"("personId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "budget_profiles_organizationId_name_key" ON "budget_profiles"("organizationId", "name");

-- CreateIndex
CREATE INDEX "budget_profiles_brandId_idx" ON "budget_profiles"("brandId");

-- CreateIndex
CREATE INDEX "budget_allocations_organizationId_status_idx" ON "budget_allocations"("organizationId", "status");

-- CreateIndex
CREATE INDEX "budget_allocations_budgetProfileId_idx" ON "budget_allocations"("budgetProfileId");

-- CreateIndex
CREATE INDEX "budget_allocations_campaignId_idx" ON "budget_allocations"("campaignId");

-- CreateIndex
CREATE INDEX "budget_ledger_organizationId_occurredAt_idx" ON "budget_ledger"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "budget_ledger_budgetProfileId_idx" ON "budget_ledger"("budgetProfileId");

-- CreateIndex
CREATE INDEX "budget_ledger_allocationId_idx" ON "budget_ledger"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripePaymentIntentId_key" ON "payments"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "payments_organizationId_status_idx" ON "payments"("organizationId", "status");

-- CreateIndex
CREATE INDEX "payouts_organizationId_status_idx" ON "payouts"("organizationId", "status");

-- CreateIndex
CREATE INDEX "snippet_library_organizationId_channel_idx" ON "snippet_library"("organizationId", "channel");

-- CreateIndex
CREATE INDEX "snippet_library_brandId_idx" ON "snippet_library"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "snippet_library_organizationId_name_channel_key" ON "snippet_library"("organizationId", "name", "channel");

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_identities" ADD CONSTRAINT "person_identities_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_identities" ADD CONSTRAINT "person_identities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_consents" ADD CONSTRAINT "person_consents_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "person_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_notes" ADD CONSTRAINT "person_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_notes" ADD CONSTRAINT "person_notes_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_notes" ADD CONSTRAINT "person_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mem_embeddings" ADD CONSTRAINT "mem_embeddings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mem_embeddings" ADD CONSTRAINT "mem_embeddings_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mem_embeddings" ADD CONSTRAINT "mem_embeddings_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_topics" ADD CONSTRAINT "person_topics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_topics" ADD CONSTRAINT "person_topics_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_objectives" ADD CONSTRAINT "person_objectives_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_objectives" ADD CONSTRAINT "person_objectives_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_profiles" ADD CONSTRAINT "budget_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_profiles" ADD CONSTRAINT "budget_profiles_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_budgetProfileId_fkey" FOREIGN KEY ("budgetProfileId") REFERENCES "budget_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "person_objectives"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_budgetProfileId_fkey" FOREIGN KEY ("budgetProfileId") REFERENCES "budget_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "budget_allocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "marketing_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_ledger" ADD CONSTRAINT "budget_ledger_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_budgetProfileId_fkey" FOREIGN KEY ("budgetProfileId") REFERENCES "budget_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_budgetProfileId_fkey" FOREIGN KEY ("budgetProfileId") REFERENCES "budget_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snippet_library" ADD CONSTRAINT "snippet_library_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "snippet_library" ADD CONSTRAINT "snippet_library_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
