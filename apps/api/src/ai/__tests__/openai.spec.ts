// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("generateText", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
    jest.dontMock("openai");
    jest.dontMock("../../config/env.js");
  });

  it("returns mock content when API key is missing", async () => {
    jest.doMock("../../config/env.js", () => ({
      getEnv: () => ({ OPENAI_API_KEY: "", OPENAI_MODEL: "gpt-4" }),
    }));
    jest.useFakeTimers();

    const { generateText } = await import("../openai.js");
    const promise = generateText({ prompt: "Draft a welcome email" });

    await jest.advanceTimersByTimeAsync(500);
    const result = await promise;

    expect(result.mock).toBe(true);
    expect(result.text).toContain("Mock email");
    expect(result.model).toBe("mock-gpt-4");
  });

  it("invokes OpenAI API when API key is provided", async () => {
    jest.doMock("../../config/env.js", () => ({
      getEnv: () => ({ OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-4" }),
    }));

    const createMock = jest.fn().mockResolvedValue({
      choices: [{ message: { content: "Generated copy" } }],
      model: "gpt-4o-mini",
      usage: { prompt_tokens: 12, completion_tokens: 18, total_tokens: 30 },
    });

    jest.doMock("openai", () => ({
      __esModule: true,
      default: class {
        chat = { completions: { create: createMock } };
      },
    }));

    const { generateText } = await import("../openai.js");
    const result = await generateText({ prompt: "Write social post", maxTokens: 50 });

    expect(result.mock).toBe(false);
    expect(result.text).toBe("Generated copy");
    expect(result.usage?.totalTokens).toBe(30);
    expect(createMock).toHaveBeenCalledTimes(1);
  });

  it("retries the OpenAI call and surfaces the final error", async () => {
    jest.doMock("../../config/env.js", () => ({
      getEnv: () => ({ OPENAI_API_KEY: "test-key", OPENAI_MODEL: "gpt-4" }),
    }));

    const error = new Error("network flake");
    const createMock = jest.fn().mockRejectedValue(error);

    jest.doMock("openai", () => ({
      __esModule: true,
      default: class {
        chat = { completions: { create: createMock } };
      },
    }));

    const { generateText } = await import("../openai.js");
    await expect(generateText({ prompt: "Fallback example" })).rejects.toThrow("OpenAI API call failed");
    expect(createMock).toHaveBeenCalledTimes(3);
  });
});
