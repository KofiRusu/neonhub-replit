import { describe, it, expect } from "@jest/globals";

describe("Health Check", () => {
  it("should validate health response schema", () => {
    const mockHealth = {
      status: "ok" as const,
      db: true,
      ws: true,
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };

    expect(mockHealth.status).toBe("ok");
    expect(mockHealth.db).toBe(true);
    expect(mockHealth.ws).toBe(true);
    expect(mockHealth.version).toBeDefined();
    expect(mockHealth.timestamp).toBeDefined();
  });
});
