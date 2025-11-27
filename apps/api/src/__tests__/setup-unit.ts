// @ts-nocheck
/**
 * Jest Unit Test Setup
 * Applies aggressive mocking so unit suites stay within memory limits.
 */

import { jest } from "@jest/globals";
// Load Prisma mock early so downstream modules pick it up via global cache
const { mockPrismaClient } = require("../__mocks__/prisma.ts");
(globalThis as Record<string, unknown>).prisma = mockPrismaClient;

// Increase test timeout for unit tests interacting with async pipelines
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";
process.env.USE_MOCK_CONNECTORS = "true";
process.env.PORT = "4100";
process.env.NEXTAUTH_SECRET = "test-secret-key-32-chars-long";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.CORS_ORIGINS = "http://localhost:3000";

// Suppress console output during tests (except errors)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Heavy dependency mocks (use manual mocks from __mocks__)
jest.mock("../db/prisma.js", () => ({ prisma: mockPrismaClient }));
jest.mock("../../db/prisma", () => ({ prisma: mockPrismaClient }), { virtual: true });
jest.mock("@tensorflow/tfjs");
jest.mock("@tensorflow/tfjs-node");
jest.mock("puppeteer");
jest.mock("superjson", () => ({
  stringify: jest.fn((value: unknown) => JSON.stringify(value)),
  parse: jest.fn((value: string) => JSON.parse(value)),
}));

// External service mocks
jest.mock("openai", () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: "test-completion-id",
          object: "chat.completion",
          created: Date.now(),
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "This is a mocked AI response for testing purposes.",
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      },
    };

    embeddings = {
      create: jest.fn().mockResolvedValue({
        data: [
          {
            embedding: new Array(1536).fill(0.1),
          },
        ],
        usage: {
          prompt_tokens: 5,
          total_tokens: 5,
        },
      }),
    };
  }

  return { __esModule: true, default: MockOpenAI, OpenAI: MockOpenAI };
});

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_test123" }),
      retrieve: jest.fn().mockResolvedValue({ id: "cus_test123", email: "test@example.com" }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({ id: "sub_test123", status: "active" }),
      retrieve: jest.fn().mockResolvedValue({ id: "sub_test123", status: "active" }),
    },
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: "customer.subscription.created",
        data: { object: {} },
      }),
    },
  }));
});

jest.mock("twilio", () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: "SM_test123",
        status: "sent",
        to: "+1234567890",
        from: "+1234567890",
        body: "Test message",
      }),
    },
  }));
});

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        id: "email_test123",
        from: "test@example.com",
        to: "recipient@example.com",
        subject: "Test Email",
      }),
    },
  })),
}));

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "job_test123" }),
    getJobCounts: jest.fn().mockResolvedValue({ active: 0, completed: 0, failed: 0, waiting: 0 }),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn().mockReturnThis(),
    removeListener: jest.fn().mockReturnThis(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("socket.io", () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
    close: jest.fn(),
  })),
}));

// Export mocked prisma for helper usage
export const mockPrisma = require("../db/prisma.js").prisma;

console.info("✅ Unit test setup loaded with heavy dependency mocks");
