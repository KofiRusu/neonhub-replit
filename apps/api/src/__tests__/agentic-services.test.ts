import { describe, expect, jest, test, beforeEach, beforeAll } from "@jest/globals";
import type { ConsentStatus, NormalizedEvent } from "../types/agentic.js";

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
  person: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  identity: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
} as Record<string, any>;

const txMock = {
  identity: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  person: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

prismaMock.$transaction = jest.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
  callback(txMock),
);

(globalThis as Record<string, unknown>).prisma = prismaMock;

const checkDatabaseConnectionMock = jest.fn();

const resolveMock = jest.fn(async () => "person-123");
const updateTopicMock = jest.fn(async (_personId: string, _topic: string, _weight: number) => undefined);
const getConsentMock = jest.fn(async (_personId: string, _channel: string) => "granted" as ConsentStatus);
const getMemoryMock = jest.fn(async (_personId: string) => []);

const createCompletionMock = jest.fn(async () => ({
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
}));

const createEmbeddingMock = jest.fn(async () => ({
  data: [{ embedding: [0.1, 0.2, 0.3] }],
}));
const moduleMocksReady = (async () => {
  await jest.unstable_mockModule("../db/prisma.js", () => ({
    prisma: prismaMock,
    checkDatabaseConnection: checkDatabaseConnectionMock,
  }));
  await jest.unstable_mockModule("../lib/prisma.js", () => ({
    prisma: prismaMock,
    checkDatabaseConnection: checkDatabaseConnectionMock,
  }));
  await jest.unstable_mockModule("../lib/openai.js", () => ({
    openai: {
      chat: {
        completions: {
          create: createCompletionMock,
        },
      },
      embeddings: {
        create: createEmbeddingMock,
      },
    },
    isOpenAIConfigured: false,
  }));
})();

type EventIntakeServiceType = typeof import("../services/event-intake.service.js").EventIntakeService;
type LearningServiceType = typeof import("../services/learning-loop.service.js").LearningService;
type BrandVoiceServiceType = typeof import("../services/brand-voice.service.js").BrandVoiceService;
type PersonServiceModuleType = typeof import("../services/person.service.js");

let EventIntakeService: EventIntakeServiceType;
let LearningService: LearningServiceType;
let BrandVoiceService: BrandVoiceServiceType;
let PersonServiceModule: PersonServiceModuleType;

beforeAll(async () => {
  await moduleMocksReady;
  PersonServiceModule = await import("../services/person.service.js");
  ({ EventIntakeService } = await import("../services/event-intake.service.js"));
  ({ LearningService } = await import("../services/learning-loop.service.js"));
  ({ BrandVoiceService } = await import("../services/brand-voice.service.js"));
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(PersonServiceModule.PersonService, "resolve").mockImplementation(resolveMock);
  jest
    .spyOn(PersonServiceModule.PersonService, "updateTopic")
    .mockImplementation(async (personId: string, topic: string, weight: number) => {
      await updateTopicMock(personId, topic, weight);
    });
  jest
    .spyOn(PersonServiceModule.PersonService, "getConsent")
    .mockImplementation(async (personId: string, channel: string) => getConsentMock(personId, channel));
  jest
    .spyOn(PersonServiceModule.PersonService, "getMemory")
    .mockImplementation(async (personId: string) => getMemoryMock(personId));
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
    expect(resolveMock).toHaveBeenCalled();
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
