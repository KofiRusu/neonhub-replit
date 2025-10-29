import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";
import { fetchGSCMetrics } from "../../integrations/google-search-console.js";

jest.mock("../../services/connector.service.js", () => ({
  recordConnectorUsage: jest.fn(() => Promise.resolve()),
}));

type PrismaStub = {
  connector: { findFirst: jest.Mock };
  connectorAuth: { findFirst: jest.Mock };
};

function createPrismaStub(): PrismaStub & PrismaClient {
  return {
    connector: {
      findFirst: jest.fn(),
    },
    connectorAuth: {
      findFirst: jest.fn(),
    },
  } as unknown as PrismaStub & PrismaClient;
}

describe("Google Search Console integration", () => {
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns fallback metrics when connector is not registered", async () => {
    const prisma = createPrismaStub();
    (prisma.connector.findFirst as unknown as jest.Mock).mockImplementation(() => Promise.resolve(null));

    const metrics = await fetchGSCMetrics({
      organizationId: "org-1",
      siteUrl: "https://example.com",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-07"),
      prisma,
    });

    expect(metrics).toHaveLength(2);
    expect(metrics[0].url).toContain("https://example.com");
    expect(prisma.connector.findFirst).toHaveBeenCalled();
  });

  it("fetches metrics from Google API when credentials exist", async () => {
    const prisma = createPrismaStub();
    (prisma.connector.findFirst as unknown as jest.Mock).mockImplementation(() =>
      Promise.resolve({ id: "connector-1" }),
    );
    (prisma.connectorAuth.findFirst as unknown as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        id: "auth-1",
        organizationId: "org-1",
        accessToken: "token",
        metadata: { siteUrl: "https://example.com" },
      }),
    );

    fetchMock.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          rows: [
            {
              keys: ["https://example.com/content/neon", "neon marketing"],
              clicks: 100,
              impressions: 2000,
              ctr: 0.05,
              position: 4.2,
            },
          ],
        }),
      } as any),
    );

    const metrics = await fetchGSCMetrics({
      organizationId: "org-1",
      siteUrl: "https://example.com",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-07"),
      prisma,
    });

    expect(metrics).toEqual([
      expect.objectContaining({
        url: "https://example.com/content/neon",
        keyword: "neon marketing",
        impressions: 2000,
        clicks: 100,
      }),
    ]);
    expect(global.fetch).toHaveBeenCalled();
  });
});
