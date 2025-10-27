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

    // Omni-Channel Connector Catalog
    const connectorDefinitions = [
      {
        name: "email",
        displayName: "Email / SMTP",
        category: "EMAIL",
        description:
          "Send transactional and marketing emails via SMTP, SendGrid, or AWS SES.",
        authType: "smtp",
        iconUrl: "https://cdn.neonhub.ai/connectors/email.svg",
        websiteUrl: "https://www.ietf.org/rfc/rfc5321.txt",
        triggers: { incoming_email: { webhook: true } },
        actions: { send_email: { to: "string", subject: "string", body: "html" } },
        authConfig: { fields: ["host", "port", "username", "password"] },
      },
      {
        name: "sms",
        displayName: "SMS / Twilio",
        category: "SMS",
        description: "Send SMS messages via Twilio or other SMS gateways.",
        authType: "api_key",
        iconUrl: "https://cdn.neonhub.ai/connectors/twilio.svg",
        websiteUrl: "https://www.twilio.com",
        triggers: { incoming_sms: { webhook: true } },
        actions: { send_sms: { to: "phone", body: "string" } },
        authConfig: { fields: ["account_sid", "auth_token"] },
      },
      {
        name: "whatsapp",
        displayName: "WhatsApp Business",
        category: "WHATSAPP",
        description: "Send WhatsApp messages via WhatsApp Business API.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/whatsapp.svg",
        websiteUrl: "https://business.whatsapp.com",
        triggers: { incoming_message: { webhook: true } },
        actions: { send_message: { to: "phone", body: "string" } },
        authConfig: { oauth_url: "https://graph.facebook.com/oauth" },
      },
      {
        name: "reddit",
        displayName: "Reddit",
        category: "REDDIT",
        description: "Post to subreddits and monitor mentions via Reddit API.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/reddit.svg",
        websiteUrl: "https://www.reddit.com",
        triggers: { new_mention: { poll: 300 } },
        actions: { post_submission: { subreddit: "string", title: "string", text: "markdown" } },
        authConfig: { oauth_url: "https://www.reddit.com/api/v1/authorize" },
      },
      {
        name: "instagram",
        displayName: "Instagram",
        category: "INSTAGRAM",
        description: "Post photos, stories, and reels via Instagram Graph API.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/instagram.svg",
        websiteUrl: "https://www.instagram.com",
        triggers: { new_comment: { webhook: true } },
        actions: { post_photo: { image_url: "url", caption: "string" } },
        authConfig: { oauth_url: "https://api.instagram.com/oauth/authorize" },
      },
      {
        name: "facebook",
        displayName: "Facebook Pages",
        category: "FACEBOOK",
        description: "Post to Facebook Pages and monitor engagement.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/facebook.svg",
        websiteUrl: "https://www.facebook.com",
        triggers: { new_post_comment: { webhook: true } },
        actions: { post_to_page: { page_id: "string", message: "string" } },
        authConfig: { oauth_url: "https://www.facebook.com/v18.0/dialog/oauth" },
      },
      {
        name: "x",
        displayName: "X (Twitter)",
        category: "X",
        description: "Post tweets, replies, and DMs via X API v2.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/x.svg",
        websiteUrl: "https://x.com",
        triggers: { new_mention: { webhook: true } },
        actions: { post_tweet: { text: "string", media_ids: "array" } },
        authConfig: { oauth_url: "https://api.x.com/oauth2/authorize" },
      },
      {
        name: "youtube",
        displayName: "YouTube",
        category: "YOUTUBE",
        description: "Upload videos and manage YouTube channel content.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/youtube.svg",
        websiteUrl: "https://www.youtube.com",
        triggers: { new_comment: { webhook: false, poll: 600 } },
        actions: { upload_video: { title: "string", file_url: "url", description: "string" } },
        authConfig: { oauth_url: "https://accounts.google.com/o/oauth2/v2/auth" },
      },
      {
        name: "tiktok",
        displayName: "TikTok",
        category: "TIKTOK",
        description: "Upload TikTok videos and track analytics.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/tiktok.svg",
        websiteUrl: "https://www.tiktok.com",
        triggers: { new_follower: { poll: 3600 } },
        actions: { upload_video: { video_url: "url", caption: "string" } },
        authConfig: { oauth_url: "https://www.tiktok.com/auth/authorize" },
      },
      {
        name: "google-ads",
        displayName: "Google Ads",
        category: "GOOGLE_ADS",
        description: "Manage Google Ads campaigns and fetch performance metrics.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/google-ads.svg",
        websiteUrl: "https://ads.google.com",
        triggers: { campaign_status_change: { poll: 1800 } },
        actions: { create_campaign: { name: "string", budget: "number" } },
        authConfig: { oauth_url: "https://accounts.google.com/o/oauth2/v2/auth" },
      },
      {
        name: "shopify",
        displayName: "Shopify",
        category: "SHOPIFY",
        description: "Sync Shopify orders, products, and customer data.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/shopify.svg",
        websiteUrl: "https://www.shopify.com",
        triggers: { new_order: { webhook: true } },
        actions: { create_product: { title: "string", price: "number", inventory: "number" } },
        authConfig: { oauth_url: "https://{shop}.myshopify.com/admin/oauth/authorize" },
      },
      {
        name: "stripe",
        displayName: "Stripe",
        category: "STRIPE",
        description: "Process payments and manage subscriptions via Stripe API.",
        authType: "api_key",
        iconUrl: "https://cdn.neonhub.ai/connectors/stripe.svg",
        websiteUrl: "https://stripe.com",
        triggers: { payment_succeeded: { webhook: true } },
        actions: {
          create_payment_intent: { amount: "number", currency: "string", customer: "string" },
        },
        authConfig: { fields: ["secret_key"] },
      },
      {
        name: "slack",
        displayName: "Slack",
        category: "SLACK",
        description: "Send notifications and manage Slack channels.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/slack.svg",
        websiteUrl: "https://slack.com",
        triggers: { new_message: { webhook: true } },
        actions: { send_message: { channel: "string", text: "string" } },
        authConfig: { oauth_url: "https://slack.com/oauth/v2/authorize" },
      },
      {
        name: "discord",
        displayName: "Discord",
        category: "DISCORD",
        description: "Manage Discord servers and send messages to channels.",
        authType: "api_key",
        iconUrl: "https://cdn.neonhub.ai/connectors/discord.svg",
        websiteUrl: "https://discord.com",
        triggers: { new_message: { webhook: true } },
        actions: { send_message: { channel_id: "string", content: "string" } },
        authConfig: { fields: ["bot_token"] },
      },
      {
        name: "linkedin",
        displayName: "LinkedIn",
        category: "LINKEDIN",
        description: "Post professional updates and articles to LinkedIn.",
        authType: "oauth2",
        iconUrl: "https://cdn.neonhub.ai/connectors/linkedin.svg",
        websiteUrl: "https://www.linkedin.com",
        triggers: { new_connection: { poll: 3600 } },
        actions: { post_update: { text: "string", visibility: "PUBLIC" } },
        authConfig: { oauth_url: "https://www.linkedin.com/oauth/v2/authorization" },
      },
    ];

    const connectors = [];
    for (const def of connectorDefinitions) {
      const connector = await tx.connector.upsert({
        where: { name: def.name },
        update: {},
        create: { ...def, isEnabled: true, isVerified: false, metadata: { demo: true } },
      });
      connectors.push(connector);
    }

    // Sample ConnectorAuth for demo user
    const emailConnector = connectors.find((c) => c.name === "email");
    const slackConnector = connectors.find((c) => c.name === "slack");

    if (emailConnector) {
      await tx.connectorAuth.upsert({
        where: { id: "conn-auth-email-demo" },
        update: {},
        create: {
          id: "conn-auth-email-demo",
          userId: founder.id,
          connectorId: emailConnector.id,
          organizationId: organization.id,
          accountName: "demo@neonhub.ai",
          status: "demo",
          metadata: { note: "Seed fixture - not functional" },
        },
      });
    }

    if (slackConnector) {
      await tx.connectorAuth.upsert({
        where: { id: "conn-auth-slack-demo" },
        update: {},
        create: {
          id: "conn-auth-slack-demo",
          userId: founder.id,
          connectorId: slackConnector.id,
          organizationId: organization.id,
          accountName: "neonhub-workspace",
          status: "demo",
          metadata: { note: "Seed fixture - not functional" },
        },
      });
    }

    // Tool definitions for omni-channel operations
    await tx.tool.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "send-email",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        agentId: agent.id,
        name: "Send Email",
        slug: "send-email",
        description: "Send an email via configured SMTP connector",
        inputSchema: { to: "string", subject: "string", body: "html", from: "string?" },
        outputSchema: { messageId: "string", status: "string", timestamp: "datetime" },
      },
    });

    await tx.tool.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "post-social",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        agentId: agent.id,
        name: "Post to Social Media",
        slug: "post-social",
        description: "Post content to social media platforms (X, LinkedIn, Facebook, Instagram)",
        inputSchema: {
          platform: "enum",
          content: "string",
          media_urls: "array?",
          schedule_time: "datetime?",
        },
        outputSchema: { post_id: "string", platform: "string", url: "string", status: "string" },
      },
    });

    await tx.tool.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: "send-sms",
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        agentId: agent.id,
        name: "Send SMS",
        slug: "send-sms",
        description: "Send SMS message via Twilio or configured SMS gateway",
        inputSchema: { to: "phone", body: "string", from: "phone?" },
        outputSchema: { sid: "string", status: "string", price: "number?" },
      },
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
      connectors,
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
