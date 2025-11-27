import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { generateText } from "../adapters/openai";

const ORIGINAL_ENV = process.env.OPENAI_API_KEY;

describe("OpenAI adapter generateText", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_ENV) {
      process.env.OPENAI_API_KEY = ORIGINAL_ENV;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  it("returns deterministic mock output when API key is missing", async () => {
    const result = await generateText({ prompt: "Hello NeonHub", model: "gpt-4o-mini", temperature: 0.7 });
    expect(result.text).toContain("[[MOCK:gpt-4o-mini T=0.7]]");
    expect(result.text).toContain("Hello NeonHub");
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThanOrEqual(result.inputTokens);
  });

  it("returns live placeholder output when API key is present", async () => {
    process.env.OPENAI_API_KEY = "test-token";
    const result = await generateText({ prompt: "Draft roadmap", model: "gpt-4o", temperature: 0.3 });
    expect(result.text).toContain("[[LIVE:gpt-4o]]");
    expect(result.inputTokens).toBe(Math.ceil("Draft roadmap".length / 4));
    expect(result.outputTokens).toBe(Math.ceil(result.text.length / 4));
  });
});
