import { describe, expect, jest, test, beforeEach } from "@jest/globals";
import type { NormalizedEvent } from "../types/agentic.js";

const prismaMock = {
  snippetLibrary: {
    findFirst: jest.fn(),
  },
  brandVoice: {
    findFirst: jest.fn(),
  },
  brand: {
    findUnique: jest.fn(),
  },
  objective: {
    findMany: jest.fn(),
  },
  event: {
    findMany: jest.fn(),
  },
  memEmbedding: {
    create: jest.fn(),
  },
} as any;

jest.unstable_mockModule("../lib/prisma.js", () => ({ prisma: prismaMock }));
jest.unstable_mockModule("../services/person.service.js", () => ({
  PersonService: {
    resolve: jest.fn().mockResolvedValue("person-123"),
    updateTopic: jest.fn(),
    getConsent: jest.fn().mockResolvedValue("granted"),
    getMemory: jest.fn().mockResolvedValue([]),
  },
}));
jest.unstable_mockModule("../lib/openai.js", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: "mock",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  body: "Hello",
                  variants: [{ body: "Hello" }],
                }),
              },
            },
          ],
          usage: {},
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
    },
  },
  isOpenAIConfigured: false,
}));

const { EventIntakeService } = await import("../services/event-intake.service.js");
const { LearningService } = await import("../services/learning-loop.service.js");
const { BrandVoiceService } = await import("../services/brand-voice.service.js");
const { PersonService } = await import("../services/person.service.js");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("EventIntakeService", () => {
  test("classify maps click events to engagement intent", () => {
    const event: NormalizedEvent = {
      organizationId: "org",
      personId: "person",
      channel: "email",
      type: "link_click",
      payload: null,
      metadata: null,
      occurredAt: new Date(),
    };

    const result = EventIntakeService.classify(event);
    expect(result.intent).toBe("engagement");
    expect(result.topic).toBe("conversion");
    expect(result.sentiment).toBe("positive");
  });

  test("normalize resolves person when missing", async () => {
    const rawEvent = {
      organizationId: "org-1",
      channel: "Email",
      type: "click",
      email: "test@example.com",
    } as any;

    const normalized = await EventIntakeService.normalize(rawEvent);
    expect(PersonService.resolve).toHaveBeenCalled();
    expect(normalized.personId).toBe("person-123");
    expect(normalized.channel).toBe("email");
    expect(normalized.type).toBe("click");
  });
});

describe("LearningService", () => {
  test("optimizeCadence calculates average interval", async () => {
    const now = Date.now();
    prismaMock.event.findMany.mockResolvedValue([
      { occurredAt: new Date(now), channel: "email", sentiment: "positive" },
      { occurredAt: new Date(now - 6 * 60 * 60 * 1000), channel: "sms", sentiment: "neutral" },
      { occurredAt: new Date(now - 12 * 60 * 60 * 1000), channel: "email", sentiment: "negative" },
    ]);

    const recommendation = await LearningService.optimizeCadence("person-1");
    expect(recommendation.channel).toBe("email");
    expect(recommendation.confidence).toBeGreaterThan(0.4);
    expect(recommendation.nextSendTime.getTime()).toBeGreaterThan(now);
  });
});

describe("BrandVoiceService", () => {
  test("guardrail detects forbidden phrasing", async () => {
    prismaMock.snippetLibrary.findFirst.mockResolvedValue(null);
    const result = await BrandVoiceService.guardrail("BUY NOW limited offer", "email", "brand-1");
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
