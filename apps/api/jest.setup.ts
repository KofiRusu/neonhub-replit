import path from "path";
import { jest } from "@jest/globals";
import { config as loadEnv } from "dotenv";

const envPath = path.resolve(process.cwd(), ".env.test");

loadEnv({
  path: envPath,
  override: false,
});

process.env.NODE_ENV = process.env.NODE_ENV || "test";

// Mock superjson
jest.mock("superjson", () => ({
  __esModule: true,
  default: {
    serialize: (data: unknown) => ({ json: data }),
    deserialize: <T>(value: T) => value,
  },
  serialize: (data: unknown) => ({ json: data }),
  deserialize: <T>(value: T) => value,
  stringify: JSON.stringify,
  parse: JSON.parse,
}));

// Mock TensorFlow.js to prevent heavy memory usage
jest.mock("@tensorflow/tfjs", () => ({
  tensor: jest.fn(() => ({ dispose: jest.fn() })),
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn(() => Promise.resolve({ history: {} })),
    predict: jest.fn(() => ({ dataSync: () => [0.5] })),
  })),
  layers: {
    dense: jest.fn(),
  },
  dispose: jest.fn(),
  tidy: jest.fn((fn: () => any) => fn()),
}));

// Mock Puppeteer to prevent Chromium downloads
jest.mock("puppeteer", () => ({
  launch: jest.fn(() =>
    Promise.resolve({
      newPage: jest.fn(() =>
        Promise.resolve({
          goto: jest.fn(() => Promise.resolve()),
          screenshot: jest.fn(() => Promise.resolve(Buffer.from(""))),
          close: jest.fn(() => Promise.resolve()),
        })
      ),
      close: jest.fn(() => Promise.resolve()),
    })
  ),
}));

// Mock OpenAI client
jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() =>
          Promise.resolve({
            choices: [{ message: { content: "Mock response" } }],
          })
        ),
      },
    },
    embeddings: {
      create: jest.fn(() =>
        Promise.resolve({
          data: [{ embedding: new Array(1536).fill(0.1) }],
        })
      ),
    },
  })),
}));

// Mock Redis for BullMQ
jest.mock("redis", () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(() => Promise.resolve()),
    disconnect: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve("OK")),
    del: jest.fn(() => Promise.resolve(1)),
  })),
}));

// Mock BullMQ Queue
jest.mock("bullmq", () => ({
  Queue: jest.fn(() => ({
    add: jest.fn(() => Promise.resolve({ id: "mock-job-id" })),
    close: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
  })),
  Worker: jest.fn(),
}));

// Mock heavy Google APIs
jest.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
        getAccessToken: jest.fn(() => Promise.resolve({ token: "mock-token" })),
      })),
    },
    gmail: jest.fn(() => ({
      users: {
        messages: {
          send: jest.fn(() => Promise.resolve({ data: { id: "mock-message-id" } })),
        },
      },
    })),
  },
}));

// Increase test timeout for integration tests
jest.setTimeout(30000);
