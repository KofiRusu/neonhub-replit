import { describe, it, expect, jest, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { WhatsAppConnector } from "../services/WhatsAppConnector.js";

const connector = new WhatsAppConnector();

const accountSid = "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
const authToken = "test-auth-token";
const defaultFrom = "whatsapp:+15550001111";

const originalFetch = global.fetch;
const mockFetch = jest.fn<typeof fetch>();

beforeAll(() => {
  mockFetch.mockImplementation(async (url: RequestInfo | URL, init?: RequestInit) => {
    const endpoint = typeof url === "string" ? url : url.toString();
    const bodyString = typeof init?.body === "string" ? init.body : undefined;

    if (endpoint.endsWith("/Messages.json") && init?.method === "POST") {
      const params = bodyString ? new URLSearchParams(bodyString) : new URLSearchParams();
      const to = params.get("To");
      const from = params.get("From");
      const body = params.get("Body");

      if (!to || !from || !body) {
        return {
          ok: false,
          status: 400,
          async text() {
            return "Missing parameters";
          },
        } as Response;
      }

      return {
        ok: true,
        status: 201,
        async json() {
          return {
            sid: "WAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            status: "queued",
            to,
            from,
            body,
            dateCreated: new Date().toISOString(),
          };
        },
      } as Response;
    }

    if (endpoint.includes("/Messages/") && (!init || (init.method ?? "GET") === "GET")) {
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            sid: "WAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            status: "delivered",
            to: "whatsapp:+15551234567",
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

describe("WhatsAppConnector", () => {
  it("sends session messages with whatsapp-prefixed addresses", async () => {
    const action = connector.actions.find(a => a.id === "sendMessage");
    if (!action) {
      throw new Error("sendMessage action not registered");
    }

    const result = await action.execute({
      auth: {
        apiKey: accountSid,
        apiSecret: authToken,
        metadata: { fromNumber: "+15550001111" },
      },
      input: {
        to: "+15551234567",
        message: "Hello from WhatsApp tests",
      },
    });

    expect(result).toMatchObject({
      messageId: "WAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      status: "queued",
      to: "whatsapp:+15551234567",
      from: defaultFrom,
    });

    const call = mockFetch.mock.calls[0];
    if (!call) {
      throw new Error("Expected fetch to be called");
    }
    const init = (call[1] ?? {}) as RequestInit;
    const bodyString = typeof init.body === "string" ? init.body : "";
    const params = new URLSearchParams(bodyString);
    expect(params.get("To")).toBe("whatsapp:+15551234567");
    expect(params.get("From")).toBe(defaultFrom);
    expect(params.get("Body")).toBe("Hello from WhatsApp tests");
  });

  it("sends template messages with parameter substitution", async () => {
    const action = connector.actions.find(a => a.id === "sendTemplate");
    if (!action) {
      throw new Error("sendTemplate action not registered");
    }

    await action.execute({
      auth: {
        apiKey: accountSid,
        apiSecret: authToken,
        metadata: { fromNumber: defaultFrom },
      },
      input: {
        to: "whatsapp:+15559876543",
        templateName: "order_confirmation",
        params: ["John", "#12345"],
        languageCode: "en_GB",
      },
    });

    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    if (!lastCall) {
      throw new Error("Expected fetch to be called");
    }
    const init = (lastCall[1] ?? {}) as RequestInit;
    const bodyString = typeof init.body === "string" ? init.body : "";
    const params = new URLSearchParams(bodyString);
    expect(params.get("Body")).toBe("[en_GB] order_confirmation: John, #12345");
    expect(params.get("PersistentAction")).toBe("template_name=order_confirmation");
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
      input: { messageId: "WAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" },
    });

    const statusResult = result as { status: string; segments: number };
    expect(statusResult.status).toBe("delivered");
    expect(statusResult.segments).toBe(1);
  });

  it("fails testConnection with missing credentials", async () => {
    await expect(connector.testConnection({})).resolves.toBe(false);
  });
});
