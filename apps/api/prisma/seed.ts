import { PrismaClient, ConnectorKind, AgentKind, AgentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding core NeonHub data…");
  const organization = await prisma.organization.upsert({
    where: { slug: "primary" },
    update: {},
    create: {
      slug: "primary",
      name: "NeonHub",
      plan: "scale",
      settings: {
        timezone: "UTC",
        theme: "neon",
      },
    },
  });

  await prisma.brand.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: "neonhub",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      slug: "neonhub",
      name: "NeonHub",
      description: "Default brand for NeonHub",
      mainColor: "#2B26FE",
      slogan: "Stay Neon!",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@neonhub.ai" },
    update: {},
    create: {
      email: "admin@neonhub.ai",
      name: "NeonHub Admin",
      emailVerified: new Date(),
      isBetaUser: true,
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: adminUser.id,
      },
    },
    update: {
      status: "active",
    },
    create: {
      organizationId: organization.id,
      userId: adminUser.id,
      status: "active",
    },
  });

  // Additional seed data (agents, campaigns, etc.) can be added here as needed.

  const personasData = [
    {
      name: "Creator Pro",
      summary: "Content creators producing branded sets, livestreams, and experiential pop-ups.",
    },
    {
      name: "Event Planner",
      summary: "Agencies crafting high-impact launches, weddings, and conferences that rely on statement visuals.",
    },
    {
      name: "Hospitality Marketer",
      summary: "Boutique hotels, restaurants, and venues using neon to elevate ambience and drive bookings.",
    },
  ];

  const personaRecords = await Promise.all(
    personasData.map(async ({ name, summary }) => {
      const persona = await prisma.persona.upsert({
        where: { name },
        update: { summary },
        create: { name, summary },
      });
      return persona;
    })
  );

  const personaMap = Object.fromEntries(personaRecords.map((persona) => [persona.name, persona]));

  const keywordsByPersona: Array<{ term: string; intent: string; personaName: string }> = [
    { term: "custom neon signs", intent: "commercial", personaName: "Creator Pro" },
    { term: "youtube studio neon ideas", intent: "informational", personaName: "Creator Pro" },
    { term: "event backdrop neon", intent: "commercial", personaName: "Event Planner" },
    { term: "wedding neon sign ideas", intent: "informational", personaName: "Event Planner" },
    { term: "venue neon signage", intent: "commercial", personaName: "Hospitality Marketer" },
    { term: "restaurant neon menu board", intent: "commercial", personaName: "Hospitality Marketer" },
  ];

  for (const keyword of keywordsByPersona) {
    const persona = personaMap[keyword.personaName];
    if (!persona) continue;

    // Normalize term to lowercase for citext unique constraint
    const normalizedTerm = keyword.term.toLowerCase();

    const existingKeyword = await prisma.keyword.findFirst({
      where: {
        term: normalizedTerm,
        personaId: persona.id,
      },
    });

    if (!existingKeyword) {
      await prisma.keyword.create({
        data: {
          term: normalizedTerm,
          intent: keyword.intent,
          priority: 80,
          personaId: persona.id,
        },
      });
    }
  }

  const addDays = (days: number) => {
    const base = new Date();
    base.setHours(9, 0, 0, 0);
    base.setDate(base.getDate() + days);
    return base;
  };

  const editorialEntries: Array<{
    title: string;
    publishAt: Date;
    priority: number;
    status: string;
    personaName: string;
  }> = [
    {
      title: "How to Design a Neon Logo Sign (Step-by-Step)",
      publishAt: addDays(3),
      priority: 90,
      status: "scheduled",
      personaName: "Creator Pro",
    },
    {
      title: "25 Wedding Neon Sign Ideas That Actually Wow",
      publishAt: addDays(7),
      priority: 85,
      status: "scheduled",
      personaName: "Event Planner",
    },
    {
      title: "Neon Backdrop Playbook for Experiential Launches",
      publishAt: addDays(14),
      priority: 80,
      status: "planned",
      personaName: "Event Planner",
    },
    {
      title: "Hospitality Lighting Trends: Neon That Drives Bookings",
      publishAt: addDays(21),
      priority: 75,
      status: "planned",
      personaName: "Hospitality Marketer",
    },
  ];

  for (const entry of editorialEntries) {
    const persona = personaMap[entry.personaName];
    if (!persona) continue;

    const existingEntry = await prisma.editorialCalendar.findFirst({
      where: {
        title: entry.title,
        personaId: persona.id,
      },
    });

    if (!existingEntry) {
      await prisma.editorialCalendar.create({
        data: {
          title: entry.title,
          publishAt: entry.publishAt,
          priority: entry.priority,
          status: entry.status,
          personaId: persona.id,
        },
      });
    }
  }

  console.log("Editorial seed complete.");

  const connectorsData: Array<{
    name: string;
    displayName: string;
    description: string;
    category: ConnectorKind;
    iconUrl?: string;
    websiteUrl?: string;
    authType: string;
    authConfig: Record<string, unknown>;
    triggers: Record<string, unknown>;
    actions: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    isEnabled?: boolean;
    isVerified?: boolean;
  }> = [
    {
      name: "gmail",
      displayName: "Gmail",
      description: "Send transactional or campaign email through Google Workspace with deliverability monitoring.",
      category: ConnectorKind.EMAIL,
      iconUrl: "https://assets.neonhub.ai/connectors/gmail.svg",
      websiteUrl: "https://workspace.google.com/products/gmail/",
      authType: "oauth2",
      authConfig: {
        provider: "google",
        requiredScopes: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
          "https://www.googleapis.com/auth/gmail.modify",
        ],
        docs: "https://developers.google.com/gmail/api",
      },
      triggers: {
        events: ["MESSAGE_RECEIVED", "THREAD_UPDATED"],
      },
      actions: {
        primary: ["SEND_EMAIL", "CREATE_DRAFT"],
        scheduling: ["SCHEDULE_EMAIL", "CANCEL_SCHEDULED_EMAIL"],
      },
      metadata: {
        rateLimitPerMinute: 100,
        defaultRegion: "us-central1",
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "outlook",
      displayName: "Outlook 365",
      description: "Microsoft 365 integration for send, reply, and event triggers in enterprise accounts.",
      category: ConnectorKind.EMAIL,
      iconUrl: "https://assets.neonhub.ai/connectors/outlook.svg",
      websiteUrl: "https://learn.microsoft.com/en-us/graph/outlook-mail-concept-overview",
      authType: "oauth2",
      authConfig: {
        provider: "microsoft",
        requiredScopes: ["Mail.ReadWrite", "Mail.Send", "offline_access"],
        docs: "https://learn.microsoft.com/en-us/graph/auth-v2-user",
      },
      triggers: {
        events: ["MESSAGE_RECEIVED", "MESSAGE_SENT"],
      },
      actions: {
        primary: ["SEND_EMAIL", "FORWARD_EMAIL"],
        automation: ["APPLY_CATEGORY", "ARCHIVE_MESSAGE"],
      },
      metadata: {
        supportsSharedMailboxes: true,
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "twilio-sms",
      displayName: "Twilio SMS",
      description: "Two-way SMS delivery with compliance guardrails for regulated markets.",
      category: ConnectorKind.SMS,
      iconUrl: "https://assets.neonhub.ai/connectors/twilio.svg",
      websiteUrl: "https://www.twilio.com/messaging",
      authType: "api_key",
      authConfig: {
        fields: ["ACCOUNT_SID", "AUTH_TOKEN", "MESSAGING_SERVICE_SID"],
        docs: "https://www.twilio.com/docs/sms/send-messages",
      },
      triggers: {
        events: ["MESSAGE_DELIVERED", "MESSAGE_FAILED", "INBOUND_MESSAGE"],
      },
      actions: {
        primary: ["SEND_SMS", "SCHEDULE_SMS"],
        compliance: ["CHECK_OPT_OUT", "ENFORCE_QUIET_HOURS"],
      },
      metadata: {
        quietHoursStart: "21:00",
        quietHoursEnd: "08:00",
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "whatsapp-business",
      displayName: "WhatsApp Business",
      description: "Template-driven and session-based messaging via WhatsApp Business API.",
      category: ConnectorKind.WHATSAPP,
      iconUrl: "https://assets.neonhub.ai/connectors/whatsapp.svg",
      websiteUrl: "https://www.twilio.com/whatsapp",
      authType: "api_key",
      authConfig: {
        fields: ["ACCOUNT_SID", "AUTH_TOKEN", "SENDER_NUMBER"],
        docs: "https://developers.facebook.com/docs/whatsapp",
      },
      triggers: {
        events: ["SESSION_STARTED", "SESSION_EXPIRED", "MESSAGE_DELIVERED"],
      },
      actions: {
        primary: ["SEND_TEMPLATE", "SEND_SESSION_MESSAGE"],
      },
      metadata: {
        templateNamespace: "neonhub_default",
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "reddit-ads",
      displayName: "Reddit Ads",
      description: "Campaign insights and creative publishing for Reddit Ads accounts.",
      category: ConnectorKind.REDDIT,
      iconUrl: "https://assets.neonhub.ai/connectors/reddit.svg",
      websiteUrl: "https://ads.reddit.com/",
      authType: "oauth2",
      authConfig: {
        provider: "reddit",
        requiredScopes: ["read", "identity", "creddits"],
        docs: "https://www.reddit.com/dev/api/",
      },
      triggers: {
        events: ["CAMPAIGN_SPEND_THRESHOLD", "NEW_COMMENT"],
      },
      actions: {
        primary: ["CREATE_CAMPAIGN", "ADJUST_BUDGET"],
      },
      metadata: {
        supportedObjectives: ["traffic", "conversions", "community"],
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "instagram-graph",
      displayName: "Instagram Graph",
      description: "Organic content scheduling and insights for Instagram Business accounts.",
      category: ConnectorKind.INSTAGRAM,
      iconUrl: "https://assets.neonhub.ai/connectors/instagram.svg",
      websiteUrl: "https://developers.facebook.com/docs/instagram-api",
      authType: "oauth2",
      authConfig: {
        provider: "facebook",
        requiredScopes: ["instagram_basic", "pages_show_list", "instagram_content_publish"],
        docs: "https://developers.facebook.com/docs/instagram-api/getting-started",
      },
      triggers: {
        events: ["COMMENT_RECEIVED", "MENTION_RECEIVED", "DM_RECEIVED"],
      },
      actions: {
        primary: ["PUBLISH_POST", "PUBLISH_STORY", "RESPOND_DM"],
      },
      metadata: {
        mediaTypes: ["image", "video", "reel"],
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "facebook-marketing",
      displayName: "Facebook Marketing",
      description: "Meta Ads Manager integration for campaign orchestration.",
      category: ConnectorKind.FACEBOOK,
      iconUrl: "https://assets.neonhub.ai/connectors/facebook.svg",
      websiteUrl: "https://developers.facebook.com/docs/marketing-apis/",
      authType: "oauth2",
      authConfig: {
        provider: "facebook",
        requiredScopes: ["ads_read", "ads_management", "business_management"],
        docs: "https://developers.facebook.com/docs/marketing-apis",
      },
      triggers: {
        events: ["SPEND_ALERT", "LEAD_CAPTURED"],
      },
      actions: {
        primary: ["CREATE_CAMPAIGN", "PAUSE_AD_SET", "UPDATE_CREATIVE"],
      },
      metadata: {
        supportsConversionTracking: true,
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "x-ads",
      displayName: "X Ads",
      description: "Campaign pacing and creative publishing for X Ads (formerly Twitter).",
      category: ConnectorKind.X,
      iconUrl: "https://assets.neonhub.ai/connectors/x.svg",
      websiteUrl: "https://developer.twitter.com/en/docs/twitter-ads",
      authType: "oauth1",
      authConfig: {
        fields: ["API_KEY", "API_SECRET", "ACCESS_TOKEN", "ACCESS_TOKEN_SECRET"],
        docs: "https://developer.twitter.com/en/docs/twitter-ads",
      },
      triggers: {
        events: ["CAMPAIGN_PACING", "FREQUENCY_CAP_ALERT"],
      },
      actions: {
        primary: ["PROMOTE_TWEET", "PAUSE_LINE_ITEM"],
      },
      metadata: {
        supportsDarkPosts: true,
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "youtube-studio",
      displayName: "YouTube Studio",
      description: "Video publish automation and analytics sync from YouTube Studio.",
      category: ConnectorKind.YOUTUBE,
      iconUrl: "https://assets.neonhub.ai/connectors/youtube.svg",
      websiteUrl: "https://developers.google.com/youtube",
      authType: "oauth2",
      authConfig: {
        provider: "google",
        requiredScopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
        docs: "https://developers.google.com/youtube/v3",
      },
      triggers: {
        events: ["VIDEO_PUBLISHED", "COMMENT_RECEIVED"],
      },
      actions: {
        primary: ["UPLOAD_VIDEO", "SCHEDULE_VIDEO"],
      },
      metadata: {
        defaultPrivacyStatus: "unlisted",
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "tiktok-ads",
      displayName: "TikTok Ads",
      description: "Creative upload, campaign management, and performance analytics for TikTok Ads.",
      category: ConnectorKind.TIKTOK,
      iconUrl: "https://assets.neonhub.ai/connectors/tiktok.svg",
      websiteUrl: "https://ads.tiktok.com/marketing_api",
      authType: "oauth2",
      authConfig: {
        provider: "tiktok",
        requiredScopes: ["ads.manage", "ads.report"],
        docs: "https://ads.tiktok.com/marketing_api/docs",
      },
      triggers: {
        events: ["CAMPAIGN_BUDGET_THRESHOLD", "AD_REJECTED"],
      },
      actions: {
        primary: ["CREATE_AD", "ADJUST_BUDGET", "TURN_OFF_AD"],
      },
      metadata: {
        supportedFormats: ["in-feed", "spark"],
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "google-ads",
      displayName: "Google Ads",
      description: "Search, display, and performance max campaign orchestration via Google Ads API.",
      category: ConnectorKind.GOOGLE_ADS,
      iconUrl: "https://assets.neonhub.ai/connectors/google-ads.svg",
      websiteUrl: "https://developers.google.com/google-ads/api",
      authType: "oauth2",
      authConfig: {
        provider: "google",
        requiredScopes: ["https://www.googleapis.com/auth/adwords"],
        docs: "https://developers.google.com/google-ads/api/docs/start",
      },
      triggers: {
        events: ["COST_THRESHOLD", "LOW_CONVERSION_RATE"],
      },
      actions: {
        primary: ["CREATE_CAMPAIGN", "UPDATE_BID_STRATEGY"],
      },
      metadata: {
        supportsAutoBidding: true,
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "shopify",
      displayName: "Shopify",
      description: "Commerce storefront sync for product feeds, orders, and customer segments.",
      category: ConnectorKind.SHOPIFY,
      iconUrl: "https://assets.neonhub.ai/connectors/shopify.svg",
      websiteUrl: "https://shopify.dev/",
      authType: "oauth2",
      authConfig: {
        provider: "shopify",
        requiredScopes: ["read_products", "read_customers", "write_price_rules"],
        docs: "https://shopify.dev/docs/api",
      },
      triggers: {
        events: ["ORDER_CREATED", "CUSTOMER_TAGGED"],
      },
      actions: {
        primary: ["SYNC_PRODUCT_FEED", "CREATE_DISCOUNT_CODE"],
      },
      metadata: {
        storefrontAccess: true,
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "stripe",
      displayName: "Stripe",
      description: "Revenue and payment events powering the budget engine and lifecycle cohorts.",
      category: ConnectorKind.STRIPE,
      iconUrl: "https://assets.neonhub.ai/connectors/stripe.svg",
      websiteUrl: "https://stripe.com/docs/api",
      authType: "api_key",
      authConfig: {
        fields: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
        docs: "https://stripe.com/docs/api",
      },
      triggers: {
        events: ["PAYMENT_SUCCEEDED", "PAYMENT_FAILED", "REFUND_ISSUED"],
      },
      actions: {
        primary: ["CREATE_CHECKOUT_SESSION", "REFUND_PAYMENT"],
      },
      metadata: {
        ledgerIntegration: true,
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "slack",
      displayName: "Slack",
      description: "Async collaboration surface for agent alerts, approvals, and summaries.",
      category: ConnectorKind.SLACK,
      iconUrl: "https://assets.neonhub.ai/connectors/slack.svg",
      websiteUrl: "https://api.slack.com/",
      authType: "oauth2",
      authConfig: {
        provider: "slack",
        requiredScopes: ["chat:write", "channels:read", "incoming-webhook"],
        docs: "https://api.slack.com/start",
      },
      triggers: {
        events: ["MESSAGE_POSTED", "REACTION_ADDED"],
      },
      actions: {
        primary: ["POST_MESSAGE", "CREATE_APPROVAL_THREAD"],
      },
      metadata: {
        defaultChannel: "#agent-alerts",
      },
      isEnabled: true,
      isVerified: true,
    },
    {
      name: "discord",
      displayName: "Discord",
      description: "Community sync for announcements and automated sentiment tagging.",
      category: ConnectorKind.DISCORD,
      iconUrl: "https://assets.neonhub.ai/connectors/discord.svg",
      websiteUrl: "https://discord.com/developers/docs/intro",
      authType: "bot_token",
      authConfig: {
        fields: ["BOT_TOKEN", "APPLICATION_ID"],
        docs: "https://discord.com/developers/docs/topics/oauth2",
      },
      triggers: {
        events: ["MESSAGE_CREATED", "REACTION_ADDED"],
      },
      actions: {
        primary: ["POST_MESSAGE", "TAG_MEMBER"],
      },
      metadata: {
        defaultChannel: "agent-announcements",
      },
      isEnabled: true,
      isVerified: false,
    },
    {
      name: "linkedin",
      displayName: "LinkedIn",
      description: "Organic and paid LinkedIn campaigns with audience sync.",
      category: ConnectorKind.LINKEDIN,
      iconUrl: "https://assets.neonhub.ai/connectors/linkedin.svg",
      websiteUrl: "https://learn.microsoft.com/en-us/linkedin/",
      authType: "oauth2",
      authConfig: {
        provider: "linkedin",
        requiredScopes: ["r_emailaddress", "r_liteprofile", "rw_organization_admin", "w_organization_social"],
        docs: "https://learn.microsoft.com/en-us/linkedin/shared/authentication",
      },
      triggers: {
        events: ["LEAD_GENERATED", "POST_COMMENT"],
      },
      actions: {
        primary: ["PUBLISH_POST", "SCHEDULE_POST"],
      },
      metadata: {
        supportsUtm: true,
      },
      isEnabled: true,
      isVerified: false,
    },
  ];

  const connectorRecords = await Promise.all(
    connectorsData.map((data) =>
      prisma.connector.upsert({
        where: { name: data.name },
        update: {
          displayName: data.displayName,
          description: data.description,
          category: data.category,
          iconUrl: data.iconUrl,
          websiteUrl: data.websiteUrl,
          authType: data.authType,
          authConfig: data.authConfig,
          triggers: data.triggers,
          actions: data.actions,
          metadata: data.metadata,
          isEnabled: data.isEnabled ?? true,
          isVerified: data.isVerified ?? false,
        },
        create: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          category: data.category,
          iconUrl: data.iconUrl,
          websiteUrl: data.websiteUrl,
          authType: data.authType,
          authConfig: data.authConfig,
          triggers: data.triggers,
          actions: data.actions,
          metadata: data.metadata,
          isEnabled: data.isEnabled ?? true,
          isVerified: data.isVerified ?? false,
        },
      })
    )
  );

  const connectorMap = Object.fromEntries(connectorRecords.map((record) => [record.name, record]));

  const connectorAuthSeeds: Array<{
    connectorName: string;
    accountId: string;
    accountName: string;
    scope?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }> = [
    {
      connectorName: "gmail",
      accountId: "workspace-primary",
      accountName: "NeonHub Workspace Gmail",
      scope:
        "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify",
      status: "active",
      metadata: {
        notes: "OAuth token exchange required via operator dashboard.",
      },
    },
    {
      connectorName: "twilio-sms",
      accountId: "twilio-messaging",
      accountName: "Twilio Messaging Service",
      status: "active",
      metadata: {
        notes: "API credentials stored in secret manager; tokens omitted for security.",
      },
    },
    {
      connectorName: "stripe",
      accountId: "stripe-primary",
      accountName: "Stripe Live",
      status: "pending",
      metadata: {
        notes: "Awaiting live key provisioning; seeded for schema completeness.",
      },
    },
  ];

  for (const authSeed of connectorAuthSeeds) {
    const connector = connectorMap[authSeed.connectorName];
    if (!connector) continue;

    const existingAuth = await prisma.connectorAuth.findFirst({
      where: {
        connectorId: connector.id,
        userId: adminUser.id,
        organizationId: organization.id,
      },
    });

    if (existingAuth) {
      await prisma.connectorAuth.update({
        where: { id: existingAuth.id },
        data: {
          accountId: authSeed.accountId,
          accountName: authSeed.accountName,
          scope: authSeed.scope,
          status: authSeed.status ?? existingAuth.status,
          metadata: authSeed.metadata,
          organizationId: organization.id,
        },
      });
    } else {
      await prisma.connectorAuth.create({
        data: {
          connectorId: connector.id,
          userId: adminUser.id,
          organizationId: organization.id,
          accountId: authSeed.accountId,
          accountName: authSeed.accountName,
          scope: authSeed.scope,
          status: authSeed.status ?? "active",
          metadata: authSeed.metadata,
        },
      });
    }
  }

  console.log(`Connector catalog seeded with ${connectorRecords.length} entries.`);

  const agentSeeds: Array<{
    slug: string;
    name: string;
    description: string;
    kind: AgentKind;
    config: Record<string, unknown>;
    capabilities: Array<{ name: string; config: Record<string, unknown> }>;
    settings: Array<{ key: string; value: Record<string, unknown> }>;
    tools: Array<{
      slug: string;
      name: string;
      description: string;
      inputSchema: Record<string, unknown>;
      outputSchema: Record<string, unknown>;
    }>;
  }> = [
    {
      slug: "email-campaign-agent",
      name: "Email Campaign Agent",
      description: "Coordinates personalization, approval, and delivery across verified email connectors.",
      kind: AgentKind.WORKFLOW,
      config: {
        defaultConnector: "gmail",
        fallbacks: ["outlook"],
        guardrails: {
          enforceDkim: true,
          enforceSpf: true,
          maxSendRatePerMinute: 200,
        },
      },
      capabilities: [
        {
          name: "deliverability-optimizer",
          config: {
            warmupThreshold: 0.8,
            engagementSignals: ["opens", "clicks", "spamComplaints"],
          },
        },
        {
          name: "email-throttle-manager",
          config: {
            connectors: ["gmail", "outlook"],
            quietHours: { start: "21:00", end: "08:00" },
          },
        },
      ],
      settings: [
        {
          key: "default_connector",
          value: { connector: "gmail" },
        },
        {
          key: "daily_send_cap",
          value: { limit: 5000 },
        },
      ],
      tools: [
        {
          slug: "email-delivery",
          name: "Email Delivery",
          description: "Delivers personalized email content and tracks engagement telemetry.",
          inputSchema: {
            type: "object",
            required: ["connector", "recipient", "subject", "html"],
            properties: {
              connector: { type: "string", enum: ["gmail", "outlook"] },
              recipient: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email" },
                  name: { type: "string" },
                },
              },
              subject: { type: "string" },
              html: { type: "string" },
              text: { type: "string" },
              sendAt: { type: ["string", "null"], format: "date-time" },
              metadata: { type: "object" },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              messageId: { type: "string" },
              connector: { type: "string" },
              queuedAt: { type: "string", format: "date-time" },
              estimatedDelivery: { type: "string", format: "date-time" },
            },
          },
        },
      ],
    },
    {
      slug: "sms-engagement-agent",
      name: "SMS Engagement Agent",
      description: "Handles compliant SMS and WhatsApp outreach with consent and quiet-hour enforcement.",
      kind: AgentKind.WORKFLOW,
      config: {
        defaultConnector: "twilio-sms",
        fallbackConnector: "whatsapp-business",
        consentPolicy: {
          enforceDoubleOptIn: true,
          defaultLocale: "en-US",
        },
      },
      capabilities: [
        {
          name: "sms-personalization",
          config: {
            templateLibrary: "default-sms-library",
            personalizationTokens: ["firstName", "favoriteProduct"],
          },
        },
        {
          name: "compliance-guardrail",
          config: {
            quietHours: { start: "21:30", end: "08:30" },
            restrictedRegions: ["CA-QC"],
          },
        },
      ],
      settings: [
        {
          key: "sms_quiet_hours",
          value: { start: "21:30", end: "08:30", timezone: "America/New_York" },
        },
      ],
      tools: [
        {
          slug: "sms-delivery",
          name: "SMS Delivery",
          description: "Queues and sends SMS or WhatsApp messages with opt-out compliance.",
          inputSchema: {
            type: "object",
            required: ["connector", "recipient", "message"],
            properties: {
              connector: { type: "string", enum: ["twilio-sms", "whatsapp-business"] },
              recipient: {
                type: "object",
                required: ["phone"],
                properties: {
                  phone: { type: "string" },
                  countryCode: { type: "string" },
                },
              },
              message: { type: "string" },
              templateId: { type: ["string", "null"] },
              metadata: { type: "object" },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              connector: { type: "string" },
              externalId: { type: "string" },
              deliveryStatus: { type: "string" },
            },
          },
        },
      ],
    },
    {
      slug: "social-advocacy-agent",
      name: "Social Advocacy Agent",
      description: "Plans and publishes social content across Instagram, Facebook, X, and TikTok connectors.",
      kind: AgentKind.COPILOT,
      config: {
        contentCalendarHorizonDays: 30,
        defaultPublishTime: "15:00",
        connectors: ["instagram-graph", "facebook-marketing", "x-ads", "tiktok-ads"],
      },
      capabilities: [
        {
          name: "social-scheduling",
          config: {
            connectors: ["instagram-graph", "facebook-marketing", "x-ads", "tiktok-ads"],
            timezone: "UTC",
          },
        },
        {
          name: "engagement-insights",
          config: {
            metrics: ["impressions", "engagementRate", "clickThroughRate"],
          },
        },
      ],
      settings: [
        {
          key: "default_publish_window",
          value: { start: "14:00", end: "18:00", timezone: "UTC" },
        },
      ],
      tools: [
        {
          slug: "social-publish",
          name: "Social Publish",
          description: "Publishes multi-channel social posts with media support and CTA tracking.",
          inputSchema: {
            type: "object",
            required: ["connector", "content", "publishAt"],
            properties: {
              connector: {
                type: "string",
                enum: ["instagram-graph", "facebook-marketing", "x-ads", "tiktok-ads"],
              },
              content: {
                type: "object",
                required: ["caption"],
                properties: {
                  caption: { type: "string" },
                  mediaUrl: { type: ["string", "null"], format: "uri" },
                  link: { type: ["string", "null"], format: "uri" },
                },
              },
              publishAt: { type: "string", format: "date-time" },
              campaignId: { type: ["string", "null"] },
            },
          },
          outputSchema: {
            type: "object",
            properties: {
              connector: { type: "string" },
              postId: { type: "string" },
              dashboardUrl: { type: "string" },
            },
          },
        },
      ],
    },
  ];

  for (const seed of agentSeeds) {
    const agent = await prisma.agent.upsert({
      where: {
        organizationId_slug: {
          organizationId: organization.id,
          slug: seed.slug,
        },
      },
      update: {
        name: seed.name,
        description: seed.description,
        kind: seed.kind,
        config: seed.config,
        status: AgentStatus.ACTIVE,
      },
      create: {
        organizationId: organization.id,
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        kind: seed.kind,
        status: AgentStatus.ACTIVE,
        config: seed.config,
      },
    });

    for (const capability of seed.capabilities) {
      const existingCapability = await prisma.agentCapability.findFirst({
        where: {
          agentId: agent.id,
          name: capability.name,
        },
      });

      if (existingCapability) {
        await prisma.agentCapability.update({
          where: { id: existingCapability.id },
          data: {
            config: capability.config,
          },
        });
      } else {
        await prisma.agentCapability.create({
          data: {
            agentId: agent.id,
            name: capability.name,
            config: capability.config,
          },
        });
      }
    }

    for (const setting of seed.settings) {
      await prisma.agentConfig.upsert({
        where: {
          agentId_key: {
            agentId: agent.id,
            key: setting.key,
          },
        },
        update: {
          value: setting.value,
        },
        create: {
          agentId: agent.id,
          key: setting.key,
          value: setting.value,
        },
      });
    }

    for (const tool of seed.tools) {
      await prisma.tool.upsert({
        where: {
          organizationId_slug: {
            organizationId: organization.id,
            slug: tool.slug,
          },
        },
        update: {
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          agentId: agent.id,
        },
        create: {
          organizationId: organization.id,
          slug: tool.slug,
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          agentId: agent.id,
        },
      });
    }
  }

  console.log("Agent roster and tools seeded.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
