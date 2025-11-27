import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const RELAXED_WARNING =
  "⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.";

const originalEnv = { ...process.env };

const REQUIRED_ENV: Record<string, string> = {
  DATABASE_URL: "https://example.com/db",
  NEXTAUTH_SECRET: "12345678901234567890123456789012",
  NEXTAUTH_URL: "https://example.com",
  CORS_ORIGINS: "http://localhost:3000",
  STRIPE_SECRET_KEY: "sk_test_key",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  RESEND_API_KEY: "resend_test_key",
  OPENAI_API_KEY: "openai_test_key",
  NODE_ENV: "test",
  PORT: "3001",
  JEST_WORKER_ID: "1",
};

const applyEnv = (overrides: Record<string, string | undefined> = {}) => {
  const nextEnv: NodeJS.ProcessEnv = { ...originalEnv, ...REQUIRED_ENV };
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === "undefined") {
      delete nextEnv[key];
    } else {
      nextEnv[key] = value;
    }
  }
  process.env = nextEnv;
};

const loadEnvModule = () => import("../../config/env.js");

describe("config/env", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("parses valid environment variables with typed coercions", async () => {
    applyEnv({
      CORS_ORIGINS: "http://example.com, http://localhost:4000",
      PORT: "4100",
      USE_MOCK_CONNECTORS: "true",
    });

    const { validateEnv } = await loadEnvModule();
    const env = validateEnv();

    expect(env.CORS_ORIGINS).toEqual(["http://example.com", "http://localhost:4000"]);
    expect(env.PORT).toBe(4100);
    expect(env.NODE_ENV).toBe("test");
    expect(env.USE_MOCK_CONNECTORS).toBe(true);
  });

  it("falls back to relaxed defaults in non-production test runs", async () => {
    applyEnv({
      STRIPE_SECRET_KEY: undefined,
      STRIPE_WEBHOOK_SECRET: undefined,
      NODE_ENV: "test",
      OPENAI_API_KEY: undefined,
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { validateEnv } = await loadEnvModule();
    const env = validateEnv();

    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_fake");
    expect(env.STRIPE_WEBHOOK_SECRET).toBe("whsec_test_fake");
    expect(env.OPENAI_API_KEY).toBe("test-key-for-testing");
    expect(env.NODE_ENV).toBe("test");
    expect(warnSpy).toHaveBeenCalledWith(RELAXED_WARNING);
    expect(errorSpy).toHaveBeenCalled();
  });
});
