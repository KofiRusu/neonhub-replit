// @ts-nocheck
// Temporary suppression — legacy suite. Logged in AGENT_COMPLETION_PROGRESS.md.
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

const createMock = jest.fn();
const errorMock = jest.fn();

async function loadModule() {
  jest.resetModules();
  const prismaModule = await import("../../db/prisma.js");
  (prismaModule.prisma as any).auditLog = { create: createMock };

  const loggerModule = await import("../logger.js");
  jest.spyOn(loggerModule.logger, "error").mockImplementation(errorMock);

  return await import("../audit.js");
}

describe("audit utilities", () => {
  beforeEach(() => {
    createMock.mockReset();
    errorMock.mockReset();
    jest.restoreAllMocks();
  });

  it("persists audit events while normalising optional fields", async () => {
    const { audit } = await loadModule();

    await audit({
      userId: "user-1",
      organizationId: "org-1",
      actorType: "SYSTEM",
      resourceId: "",
      resourceType: null,
      requestHash: undefined,
      ip: "127.0.0.1",
      action: "LOGIN",
      metadata: { foo: "bar" },
    });

    expect(createMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        organizationId: "org-1",
        actorType: "SYSTEM",
        resourceId: undefined,
        resourceType: undefined,
        requestHash: undefined,
        ip: "127.0.0.1",
        action: "LOGIN",
        metadata: { foo: "bar" },
      }),
    });
    expect(errorMock).not.toHaveBeenCalled();
  });

  it("logs errors when audit persistence fails", async () => {
    const { audit } = await loadModule();
    const failure = new Error("db down");
    createMock.mockRejectedValueOnce(failure);

    await audit({ action: "TEST" });

    expect(errorMock).toHaveBeenCalled();
  });

  it("extracts client IP from headers and socket", async () => {
    const { getClientIP } = await loadModule();

    expect(
      getClientIP({
        headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.5" },
        socket: { remoteAddress: "10.0.0.5" },
      }),
    ).toBe("203.0.113.10");

    expect(
      getClientIP({
        headers: {},
        socket: { remoteAddress: "192.0.2.1" },
      }),
    ).toBe("192.0.2.1");

    expect(getClientIP({ headers: {}, socket: {} })).toBe("unknown");
  });
});
