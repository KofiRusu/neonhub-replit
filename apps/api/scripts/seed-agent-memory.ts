#!/usr/bin/env tsx
import { prisma } from "../src/db/prisma.js";
import { PgVectorStore, createEmbeddingsProvider } from "@neonhub/predictive-engine";

process.env.TEST_MODE = process.env.TEST_MODE ?? "1";

const SEED_ITEMS = [
  {
    agent: "BrandVoiceAgent",
    key: "neonhub_brand_voice",
    content: "NeonHub speaks in a confident, optimistic tone with succinct kinetic phrasing and neon imagery.",
  },
  {
    agent: "ContentAgent",
    key: "webinar_follow_up",
    content: "Follow-up email template for webinar attendees highlighting actionable next steps and a demo CTA.",
  },
  {
    agent: "SEOAgent",
    key: "pillar_outline_ai_marketing",
    content: "Outline for AI marketing pillar page covering orchestration, analytics, automation, governance, and ROI.",
  },
  {
    agent: "SocialAgent",
    key: "launch_thread",
    content: "Twitter launch thread celebrating NeonHub v3.2 with bullet highlights, emojis, and a final CTA link.",
  },
];

type SeedOptions = {
  prismaClient?: typeof prisma;
  vectorStore?: PgVectorStore;
  items?: typeof SEED_ITEMS;
  testMode?: boolean;
  log?: boolean;
};

export async function seedAgentMemories(options: SeedOptions = {}) {
  const prismaClient = options.prismaClient ?? prisma;
  const testMode = options.testMode ?? process.env.TEST_MODE === "1";
  const logEnabled = options.log ?? true;
  const items = options.items ?? SEED_ITEMS;

  const store =
    options.vectorStore ?? new PgVectorStore(prismaClient as never, createEmbeddingsProvider());

  if (logEnabled) {
    console.log("🌟 Seeding agent memories...");
  }

  if (!testMode) {
    await prismaClient.$executeRawUnsafe(
      `DELETE FROM "agent_memories" WHERE "agent" IN (${items.map(() => "?").join(",")})`,
      ...items.map((item) => item.agent)
    );
  } else if (logEnabled) {
    console.log("↪ Skipping database cleanup (TEST_MODE enabled)");
  }

  for (const item of items) {
    await store.upsert(item.agent, item.key, item.content);
    if (logEnabled) {
      console.log(`  • stored ${item.agent}:${item.key}`);
    }
  }

  if (!testMode) {
    await prismaClient.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS agent_memories_embedding_idx ON "agent_memories" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);`
    );
    if (logEnabled) {
      console.log("✅ IVFFLAT index ready");
    }
  } else if (logEnabled) {
    console.log("↪ Skipping IVFFLAT index creation (TEST_MODE enabled)");
  }

  return {
    seeded: items.length,
    agents: items.map((item) => item.agent),
    testMode,
  };
}

async function main() {
  try {
    const result = await seedAgentMemories();
    console.log(`✅ Seeded ${result.seeded} agent memories for ${result.agents.length} agents`);
  } catch (error) {
    console.error("❌ Seeding failed", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

const invokedDirectly = Boolean(
  process.argv[1]?.endsWith("seed-agent-memory.ts") || process.argv[1]?.endsWith("seed-agent-memory.js")
);

if (invokedDirectly) {
  main();
}
