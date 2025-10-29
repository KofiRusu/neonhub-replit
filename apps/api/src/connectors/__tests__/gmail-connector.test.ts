import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { GmailConnector } from "../services/GmailConnector.js";

const connector = new GmailConnector();

jest.setTimeout(10000);

const originalFetch = global.fetch;
const mockFetch = jest.fn<typeof fetch>();

beforeAll(() => {
  mockFetch.mockImplementation(async (url: RequestInfo | URL) => {
    const endpoint = typeof url === "string" ? url : url.toString();

    if (endpoint.includes("gmail/v1/users/me/messages/send")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return { id: "msg_123", threadId: "thread_abc" };
        },
      } as Response;
    }

    if (endpoint.includes("gmail/v1/users/me/messages")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            messages: [
              { id: "msg_123", threadId: "thread_abc" },
              { id: "msg_456", threadId: "thread_def" },
            ],
            nextPageToken: "next-token",
            resultSizeEstimate: 2,
          };
        },
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      async json() {
        return {};
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

describe("GmailConnector (test mode)", () => {
  it("sends mail deterministically", async () => {
    const result = await connector.actions[0].execute({
      auth: { accessToken: "test-token" },
      input: { to: "test@example.com", body: "Hello" }
    });

    expect(result).toHaveProperty("id");
  });

  it("returns mock messages", async () => {
    const trigger = connector.triggers[0];
    const result = await trigger.run({ auth: { accessToken: "test-token" }, settings: {}, cursor: null });

    expect(result.items.length).toBeGreaterThan(0);
  });
});
