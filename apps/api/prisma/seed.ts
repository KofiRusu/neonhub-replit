import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NeonHub baseline data...");

  const context = await prisma.$transaction(async (tx) => {
    const founder = await tx.user.upsert({
      where: { email: "founder@neonhub.ai" },
      update: {},
      create: {
        email: "founder@neonhub.ai",
        name: "NeonHub Founder",
        image: "https://avatars.githubusercontent.com/u/2?v=4",
        emailVerified: new Date(),
      },
    });

    const organization = await tx.organization.upsert({
      where: { slug: "neonhub" },
      update: { name: "NeonHub" },
      create: {
        slug: "neonhub",
        name: "NeonHub",
        plan: "scale",
        settings: { timezone: "America/Los_Angeles", theme: "neon" },
      },
    });

    const adminRole = await tx.organizationRole.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "admin",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: "Administrator",
        slug: "admin",
        description: "Full access to the NeonHub workspace.",
      },
    });

    const managePermission = await tx.organizationPermission.upsert({
      where: {
        organizationId_key: {
          organizationId: organization.id,
          key: "workspace:manage",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        key: "workspace:manage",
        description: "Manage workspace configuration, members, and billing.",
      },
    });

    await tx.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: managePermission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: managePermission.id,
      },
    });

    const membership = await tx.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: founder.id,
        },
      },
      update: { roleId: adminRole.id, status: "active" },
      create: {
        organizationId: organization.id,
        userId: founder.id,
        roleId: adminRole.id,
        status: "active",
      },
    });

    const embeddingSpace = await tx.embeddingSpace.upsert({
      where: {
        organizationId_name: {
          organizationId: organization.id,
          name: "primary-1536",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: "primary-1536",
        provider: "openai",
        model: "text-embedding-3-large",
        dimension: 1536,
        metadata: { description: "Default embeddings for NeonHub Copilot." },
      },
    });

    const brand = await tx.brand.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "neonhub",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: "NeonHub",
        slug: "neonhub",
        description: "The unified AI operating system for marketing teams.",
        mainColor: "#2B26FE",
        slogan: "Stay Neon!",
      },
    });

    const brandVoice = await tx.brandVoice.upsert({
      where: { id: "brandvoice-neonhub" },
      update: {
        promptTemplate:
          "You are NeonHub, the strategic AI partner for marketing leaders. Speak with clarity, momentum, and optimism.",
        styleRulesJson: {
          tone: ["Energetic", "Insightful", "Trusted"],
          vocabulary: ["pipeline", "cadence", "activation"],
          perspective: "first-person plural",
        },
      },
      create: {
        id: "brandvoice-neonhub",
        brandId: brand.id,
        embeddingSpaceId: embeddingSpace.id,
        promptTemplate:
          "You are NeonHub, the strategic AI partner for marketing leaders. Speak with clarity, momentum, and optimism.",
        styleRulesJson: {
          tone: ["Energetic", "Insightful", "Trusted"],
          vocabulary: ["pipeline", "cadence", "activation"],
          perspective: "first-person plural",
        },
      },
    });

    const agent = await tx.agent.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "brand-voice-copilot",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        name: "Brand Voice Copilot",
        slug: "brand-voice-copilot",
        kind: "COPILOT",
        status: "ACTIVE",
        description: "Guides content teams with real-time tone checks and on-brand rewrites.",
        config: { defaultChannel: "marketing", guardrails: { humanReview: true } },
      },
    });

    await tx.agentCapability.deleteMany({ where: { agentId: agent.id } });
    await tx.agentCapability.createMany({
      data: [
        { agentId: agent.id, name: "summarize", config: { strategy: "abstract" } },
        { agentId: agent.id, name: "rewrite", config: { enforceTone: true } },
        { agentId: agent.id, name: "generate_content", config: { maxTokens: 600 } },
      ],
    });

    const conversation = await tx.conversation.upsert({
      where: { id: "conv-neonhub-demo" },
      update: {},
      create: {
        id: "conv-neonhub-demo",
        organizationId: organization.id,
        kind: "support",
        status: "active",
        title: "Launch Campaign Kickoff",
        createdById: founder.id,
        metadata: { channel: "workspace" },
      },
    });

    const message = await tx.message.upsert({
      where: { id: "msg-neonhub-demo" },
      update: {},
      create: {
        id: "msg-neonhub-demo",
        conversationId: conversation.id,
        authorId: founder.id,
        role: "user",
        contentJson: {
          type: "text",
          body: "We need a punchy executive summary for the NeonHub Fall launch. Keep it under 120 words.",
        },
        metadata: { medium: "workspace" },
      },
    });

    const dataset = await tx.dataset.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "brand-knowledge-base",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        embeddingSpaceId: embeddingSpace.id,
        name: "Brand Knowledge Base",
        slug: "brand-knowledge-base",
        kind: "documents",
        description: "Reference materials for NeonHub brand voice and playbooks.",
      },
    });

    const document = await tx.document.upsert({
      where: { id: "doc-style-guide" },
      update: {},
      create: {
        id: "doc-style-guide",
        datasetId: dataset.id,
        organizationId: organization.id,
        ownerId: founder.id,
        embeddingSpaceId: embeddingSpace.id,
        title: "NeonHub Brand Style Guide",
        content:
          "NeonHub brand voice is confident, energizing, and pragmatic. Always tie insights back to measurable outcomes for marketing leaders.",
        status: "published",
        metadata: { version: 1 },
      },
    });

    await tx.chunk.deleteMany({ where: { datasetId: dataset.id } });
    await tx.chunk.createMany({
      data: [
        {
          id: "chunk-style-guide-0",
          datasetId: dataset.id,
          documentId: document.id,
          embeddingSpaceId: embeddingSpace.id,
          idx: 0,
          text: "NeonHub speaks with strategic clarity. Every message should highlight measurable growth outcomes.",
        },
        {
          id: "chunk-style-guide-1",
          datasetId: dataset.id,
          documentId: document.id,
          embeddingSpaceId: embeddingSpace.id,
          idx: 1,
          text: "Tone descriptors: energetic, informed, empathetic. Avoid jargon unless it accelerates trust.",
        },
        {
          id: "chunk-style-guide-2",
          datasetId: dataset.id,
          documentId: document.id,
          embeddingSpaceId: embeddingSpace.id,
          idx: 2,
          text: "Calls-to-action should be motivating, time-bound, and connected to revenue impact.",
        },
      ],
      skipDuplicates: true,
    });

    const campaign = await tx.campaign.upsert({
      where: { id: "campaign-fall-launch" },
      update: {},
      create: {
        id: "campaign-fall-launch",
        organizationId: organization.id,
        ownerId: founder.id,
        name: "NeonHub Fall Launch",
        status: "active",
        type: "multi-channel",
        config: { goal: "Drive 500 qualified signups by Nov 30" },
        schedule: { launchDate: "2025-11-01" },
        budget: { total: 25000, currency: "USD" },
      },
    });

    await tx.campaignMetric.upsert({
      where: { id: "campaign-fall-launch-open-rate" },
      update: {
        value: 0.42,
        payload: { channel: "email", cohort: "VIP" },
      },
      create: {
        id: "campaign-fall-launch-open-rate",
        campaignId: campaign.id,
        kind: "open_rate",
        value: 0.42,
        payload: { channel: "email", cohort: "VIP" },
      },
    });

    await tx.content.upsert({
      where: { id: "content-welcome-email" },
      update: {},
      create: {
        id: "content-welcome-email",
        organizationId: organization.id,
        authorId: founder.id,
        kind: "email",
        status: "published",
        title: "Welcome to NeonHub",
        body: "NeonHub unifies your AI workflows so every campaign launches brighter and faster.",
        metadata: { campaignId: campaign.id },
        publishedAt: new Date(),
      },
    });

    await tx.metricEvent.createMany({
      data: [
        {
          id: "metric-event-page-view",
          type: "page_view",
          meta: { page: "/dashboard" },
        },
        {
          id: "metric-event-agent-run",
          type: "agent_run",
          meta: { agent: agent.slug, status: "success" },
        },
        {
          id: "metric-event-conversion",
          type: "conversion",
          meta: { campaign: campaign.id, value: "signup" },
        },
      ],
      skipDuplicates: true,
    });

    return {
      founder,
      organization,
      membership,
      embeddingSpace,
      brandVoice,
      agent,
      conversation,
      message,
      dataset,
      document,
      campaign,
    };
  });

  await prisma.$executeRaw`UPDATE "brand_voices" SET embedding = (ARRAY_FILL(0.015::real, ARRAY[1536]))::vector(1536) WHERE id = 'brandvoice-neonhub';`;
  await prisma.$executeRaw`UPDATE "messages" SET embedding = (ARRAY_FILL(0.02::real, ARRAY[1536]))::vector(1536) WHERE id = ${context.message.id};`;
  await prisma.$executeRaw`UPDATE "chunks" SET embedding = (ARRAY_FILL(0.01::real, ARRAY[1536]))::vector(1536) WHERE "datasetId" = ${context.dataset.id};`;

  console.log("✅ Founder:", context.founder.email);
  console.log("✅ Organization:", context.organization.slug);
  console.log("✅ Brand voice:", context.brandVoice.id);
  console.log("✅ Agent:", context.agent.slug);
  console.log("✅ Dataset:", context.dataset.slug);
  console.log("✅ Campaign:", context.campaign.name);
  console.log("✨ Seeding completed!");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
