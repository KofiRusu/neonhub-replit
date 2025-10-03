import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@neonhub.ai" },
    update: {},
    create: {
      email: "demo@neonhub.ai",
      name: "Demo User",
      image: "https://avatars.githubusercontent.com/u/1?v=4",
    },
  });

  console.log("✅ Created user:", user.email);

  // Create some sample content drafts
  const drafts = await Promise.all([
    prisma.contentDraft.upsert({
      where: { id: "draft-1" },
      update: {},
      create: {
        id: "draft-1",
        title: "AI Marketing Trends 2025",
        topic: "AI in Marketing",
        tone: "professional",
        audience: "Marketing professionals",
        body: "Artificial intelligence is transforming how businesses approach marketing...",
        status: "published",
        createdById: user.id,
      },
    }),
    prisma.contentDraft.upsert({
      where: { id: "draft-2" },
      update: {},
      create: {
        id: "draft-2",
        title: "Social Media Strategy Guide",
        topic: "Social Media Marketing",
        tone: "friendly",
        audience: "Small business owners",
        body: "Building an effective social media presence requires a strategic approach...",
        status: "draft",
        createdById: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${drafts.length} content drafts`);

  // Create some sample agent jobs
  const jobs = await Promise.all([
    prisma.agentJob.create({
      data: {
        agent: "content",
        input: { topic: "AI Marketing", tone: "professional" },
        output: { title: "AI Marketing Trends 2025", wordCount: 1200 },
        status: "success",
        metrics: { duration: 4500, tokens: 1500 },
        createdById: user.id,
      },
    }),
    prisma.agentJob.create({
      data: {
        agent: "seo",
        input: { url: "https://example.com" },
        output: { score: 78, issues: 3 },
        status: "success",
        metrics: { duration: 2100 },
        createdById: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${jobs.length} agent jobs`);

  // Create some metric events
  const events = await Promise.all([
    prisma.metricEvent.create({
      data: {
        type: "page_view",
        meta: { page: "/dashboard" },
      },
    }),
    prisma.metricEvent.create({
      data: {
        type: "agent_run",
        meta: { agent: "content", success: true },
      },
    }),
    prisma.metricEvent.create({
      data: {
        type: "conversion",
        meta: { campaign: "summer-launch" },
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} metric events`);

  console.log("✨ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
