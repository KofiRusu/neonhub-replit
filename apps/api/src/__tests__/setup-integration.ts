// @ts-nocheck
/**
 * Jest Integration Test Setup
 * Keeps integration suites closer to production behaviour while ensuring deterministic env vars.
 */

import { jest } from "@jest/globals";
// Share Prisma mock via global cache before modules import real client
const { mockPrismaClient } = require("../__mocks__/prisma.ts");
(globalThis as Record<string, unknown>).prisma = mockPrismaClient;

jest.setTimeout(45000);

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test_db";
process.env.USE_MOCK_CONNECTORS = "true";
process.env.PORT = "4100";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ?? "test-secret-key-32-chars-long";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? "http://localhost:3000";

// Mock heavy dependencies (reuse unit-style mocks so integration suites remain deterministic)
jest.mock("../db/prisma.js", () => ({ prisma: mockPrismaClient }));
jest.mock("../../db/prisma", () => ({ prisma: mockPrismaClient }), { virtual: true });

jest.mock("@tensorflow/tfjs");
jest.mock("@tensorflow/tfjs-node");
jest.mock("puppeteer");
jest.mock("superjson", () => ({
  stringify: jest.fn((value: unknown) => JSON.stringify(value)),
  parse: jest.fn((value: string) => JSON.parse(value)),
}));

jest.mock("openai", () => {
  class MockOpenAI {
    chat = {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: "integration-completion-id",
          object: "chat.completion",
          created: Date.now(),
          model: "gpt-4o-mini",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: "Mocked integration response",
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 8,
            completion_tokens: 12,
            total_tokens: 20,
          },
        }),
      },
    };

    embeddings = {
      create: jest.fn().mockResolvedValue({
        data: [
          {
            embedding: new Array(1536).fill(0.05),
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
      create: jest.fn().mockResolvedValue({ id: "cus_integration" }),
      retrieve: jest.fn().mockResolvedValue({ id: "cus_integration", email: "integration@example.com" }),
    },
    subscriptions: {
      create: jest.fn().mockResolvedValue({ id: "sub_integration", status: "active" }),
      retrieve: jest.fn().mockResolvedValue({ id: "sub_integration", status: "active" }),
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
        sid: "SM_integration",
        status: "sent",
        to: "+1234567890",
        from: "+1234567890",
        body: "Integration test message",
      }),
    },
  }));
});

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({
        id: "email_integration",
        from: "integration@example.com",
        to: "recipient@example.com",
        subject: "Integration Email",
      }),
    },
  })),
}));

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: "job_integration" }),
    getJobCounts: jest.fn().mockResolvedValue({ active: 0, completed: 0, failed: 0, waiting: 0 }),
    close: jest.fn().mockResolvedValue(undefined),
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

// Keep logs available but throttle volume
const originalConsole = console;
global.console = {
  ...originalConsole,
  debug: jest.fn(originalConsole.debug.bind(originalConsole)),
  info: jest.fn(originalConsole.info.bind(originalConsole)),
};

console.info("✅ Integration test setup loaded with shared mocks");
