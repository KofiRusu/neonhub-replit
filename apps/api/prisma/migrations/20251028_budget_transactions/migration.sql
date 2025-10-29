-- Create BudgetTransaction table for ledger tracking
CREATE TYPE "BudgetTransactionType" AS ENUM ('allocate', 'spend', 'reserve', 'refund', 'adjustment');

CREATE TABLE "budget_transactions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "BudgetTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "channel" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "budget_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "budget_transactions_campaign_idx" ON "budget_transactions"("campaignId");
CREATE INDEX "budget_transactions_org_idx" ON "budget_transactions"("organizationId");
CREATE INDEX "budget_transactions_type_idx" ON "budget_transactions"("type");
CREATE INDEX "budget_transactions_created_idx" ON "budget_transactions"("createdAt");

-- Add foreign key constraints
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_campaignId_fkey" 
  FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_organizationId_fkey" 
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_createdBy_fkey" 
  FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


