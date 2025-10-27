#!/usr/bin/env node
/**
 * NeonHub DB Smoke Script
 * Collects key row counts and index presence to validate omni-channel readiness.
 */

import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  const tables = await Promise.all([
    prisma.organization.count().then((count) => ({ table: "organizations", count })),
    prisma.brand.count().then((count) => ({ table: "brands", count })),
    prisma.agent.count().then((count) => ({ table: "agents", count })),
    prisma.conversation.count().then((count) => ({ table: "conversations", count })),
    prisma.message.count().then((count) => ({ table: "messages", count })),
    prisma.dataset.count().then((count) => ({ table: "datasets", count })),
    prisma.document.count().then((count) => ({ table: "documents", count })),
    prisma.chunk.count().then((count) => ({ table: "chunks", count })),
    prisma.campaign.count().then((count) => ({ table: "campaigns", count })),
    prisma.campaignMetric.count().then((count) => ({ table: "campaign_metrics", count })),
    prisma.connector.count().then((count) => ({ table: "connectors", count })),
    prisma.connectorAuth.count().then((count) => ({ table: "connector_auths", count })),
  ]);

  const connectorsByKind = await prisma.connector.groupBy({
    by: ["category"],
    _count: { _all: true },
  });

  const indexRows = await prisma.$queryRaw`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname IN (
        'brand_voices_embedding_cosine_idx',
        'messages_embedding_cosine_idx',
        'chunks_embedding_cosine_idx',
        'agent_runs_agentId_startedAt_idx',
        'campaign_metrics_campaignId_kind_ts_idx'
      )
    ORDER BY indexname;
  `;

  const payload = {
    timestamp: new Date().toISOString(),
    databaseUrl: process.env.DATABASE_URL ? "set" : "missing",
    counts: tables,
    connectorsByKind,
    indexesPresent: indexRows.map((row) => row.indexname),
  };

  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch((error) => {
    console.error("❌ db-smoke failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
