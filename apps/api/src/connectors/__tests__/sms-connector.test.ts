import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { SMSConnector } from "../services/SMSConnector.js";

const connector = new SMSConnector();

const accountSid = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const authToken = "test-auth-token";
const defaultFrom = "+15550001111";

const originalFetch = global.fetch;
const mockFetch = jest.fn<typeof fetch>();

beforeAll(() => {
  mockFetch.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = typeof url === "string" ? url : url.toString();

    if (endpoint.endsWith("/Messages.json") && init?.method === "POST") {
      return {
        ok: true,
        status: 201,
        async json() {
          return {
            sid: "SM1234567890",
            status: "queued",
            to: "+15551234567",
            from: defaultFrom,
            dateCreated: new Date().toISOString(),
          };
        },
      } as Response;
    }

    if (endpoint.includes("/Messages/") && init?.method !== "POST") {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            sid: "SM1234567890",
            status: "delivered",
            to: "+15551234567",
            from: defaultFrom,
            numSegments: "1",
            dateUpdated: new Date().toISOString(),
            errorCode: null,
            errorMessage: null,
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

describe("SMSConnector", () => {
  it("sends SMS messages with provided credentials", async () => {
    const action = connector.actions.find(a => a.id === "sendSms");
    if (!action) {
      throw new Error("sendSms action not registered");
    }

    const result = await action.execute({
      auth: {
        apiKey: accountSid,
        apiSecret: authToken,
        metadata: { fromNumber: defaultFrom },
      },
      input: {
        to: "+15551234567",
        message: "Hello from tests",
      },
    });

    expect(result).toMatchObject({
      messageId: "SM1234567890",
      status: "queued",
      to: "+15551234567",
      from: defaultFrom,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retrieves message status", async () => {
    const action = connector.actions.find(a => a.id === "getMessageStatus");
    if (!action) {
      throw new Error("getMessageStatus action not registered");
    }

    const result = await action.execute({
      auth: {
        apiKey: accountSid,
        apiSecret: authToken,
        metadata: { fromNumber: defaultFrom },
      },
      input: { messageId: "SM1234567890" },
    });

    expect(result).toMatchObject({
      messageId: "SM1234567890",
      status: "delivered",
      segments: 1,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("fails testConnection with missing credentials", async () => {
    await expect(connector.testConnection({})).resolves.toBe(false);
  });
});
