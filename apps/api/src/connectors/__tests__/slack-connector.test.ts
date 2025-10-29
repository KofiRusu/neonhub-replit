import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { SlackConnector } from "../services/SlackConnector.js";

const connector = new SlackConnector();

jest.setTimeout(10000);

const originalFetch = global.fetch;
const mockFetch = jest.fn<typeof fetch>();

beforeAll(() => {
  mockFetch.mockImplementation(async (url: RequestInfo | URL) => {
    const endpoint = typeof url === "string" ? url : url.toString();

    if (endpoint.endsWith("chat.postMessage")) {
      return {
        ok: true,
        async json() {
          return { ok: true, ts: "123.456" };
        },
      } as Response;
    }

    if (endpoint.endsWith("conversations.history")) {
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            latest: "789.000",
            messages: [
              { ts: "123.456", text: "Hello", user: "U123" },
              { ts: "789.000", text: "Another message", user: "U456" },
            ],
          };
        },
      } as Response;
    }

    return {
      ok: true,
      async json() {
        return { ok: true };
      },
    } as Response;
  });

  (global as unknown as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  (global as unknown as { fetch: typeof fetch }).fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockClear();
});

describe("SlackConnector (test mode)", () => {
  it("sends messages without network access", async () => {
    const result = await connector.actions[0].execute({
      auth: { accessToken: "test-token" },
      input: { channel: "C123", text: "Hello from tests" }
    });

    expect(result).toHaveProperty("ts");
  });

  it("provides mock history for triggers", async () => {
    const trigger = connector.triggers[0];
    const result = await trigger.run({ auth: { accessToken: "test-token" }, settings: { channel: "C123" }, cursor: null });

    expect(result.items).not.toHaveLength(0);
  });
});
