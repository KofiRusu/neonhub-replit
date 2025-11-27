import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { ConnectorFactory } from "../factory.js";
import { recordToolExecution } from "../../services/tool-execution.service.js";

jest.mock("../../services/tool-execution.service.js", () => ({
  recordToolExecution: jest.fn(async (_connector, _action, _payload, executor) => executor()),
}));

describe("ConnectorFactory", () => {
  beforeEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.CONNECTORS_LIVE_MODE;
    delete process.env.USE_MOCK_CONNECTORS;
    (recordToolExecution as jest.Mock).mockClear();
  });

  afterEach(() => {
    delete process.env.CONNECTORS_LIVE_MODE;
    delete process.env.USE_MOCK_CONNECTORS;
    process.env.NODE_ENV = "test";
  });

  describe("Mock Mode", () => {
    it("should indicate mock mode is enabled in test environment", () => {
      expect(ConnectorFactory.isMockMode()).toBe(true);
    });

    it("should create a Gmail mock connector", () => {
      const connector = ConnectorFactory.create("gmail");
      expect(connector).toBeDefined();
      expect(connector.constructor.name).toContain("Mock");
    });

    it("should create a Slack mock connector", () => {
      const connector = ConnectorFactory.create("slack");
      expect(connector).toBeDefined();
      expect(connector.constructor.name).toContain("Mock");
    });

    it("should create a Twilio mock connector", () => {
      const connector = ConnectorFactory.create("twilio");
      expect(connector).toBeDefined();
      expect(connector.constructor.name).toContain("Mock");
    });
  });

  describe("Real Mode", () => {
    it("should create real connectors when CONNECTORS_LIVE_MODE is true", () => {
      process.env.CONNECTORS_LIVE_MODE = "true";
      const connector = ConnectorFactory.create("gmail");
      expect(ConnectorFactory.isMockMode()).toBe(false);
      expect(connector.constructor.name).toBe("GmailConnector");
    });
  });

  describe("Gmail Mock Connector", () => {
    it("should send email without network calls", async () => {
      const connector = ConnectorFactory.create("gmail") as any;
      
      const result = await connector.send({
        to: "test@example.com",
        subject: "Test Subject",
        body: "Test Body",
      });

      expect(result).toMatchObject({
        success: true,
      });
      expect(result.id).toMatch(/^mock-gmail-/);
    });

    it("should list messages with deterministic pagination", async () => {
      const connector = ConnectorFactory.create("gmail") as any;
      
      const result = await connector.listMessages({ maxResults: 5 });

      expect(result.messages).toHaveLength(5);
      expect(result.messages[0]).toMatchObject({
        id: "mock-msg-0",
        threadId: "mock-thread-0",
      });
      expect(result.nextPageToken).toBe("mock-next-page-token");
    });

    it("should get profile without API calls", async () => {
      const connector = ConnectorFactory.create("gmail") as any;
      
      const profile = await connector.getProfile();

      expect(profile).toMatchObject({
        email: "mock-user@example.com",
        name: "Mock User",
      });
    });

    it("records telemetry for connector calls", async () => {
      const connector = ConnectorFactory.create("gmail") as any;
      await connector.send({
        to: "telemetry@example.com",
        subject: "Telemetry Test",
        body: "Hello",
      });
      expect(recordToolExecution).toHaveBeenCalledWith(
        "gmail",
        "send",
        expect.objectContaining({ to: "telemetry@example.com" }),
        expect.any(Function),
      );
    });
  });

  describe("Slack Mock Connector", () => {
    it("should post message without network calls", async () => {
      const connector = ConnectorFactory.create("slack") as any;
      
      const result = await connector.postMessage({
        channel: "C123",
        text: "Test message",
      });

      expect(result).toMatchObject({
        channel: "C123",
        success: true,
      });
      expect(result.ts).toMatch(/^\d+\.\d+$/);
    });

    it("should list channels with mock data", async () => {
      const connector = ConnectorFactory.create("slack") as any;
      
      const result = await connector.listChannels();

      expect(result.channels).toHaveLength(3);
      expect(result.channels[0]).toMatchObject({
        id: "C123",
        name: "general",
        isMember: true,
      });
    });

    it("should upload file without actual upload", async () => {
      const connector = ConnectorFactory.create("slack") as any;
      
      const result = await connector.uploadFile({
        channels: "C123",
        file: Buffer.from("test"),
        filename: "test.txt",
      });

      expect(result).toMatchObject({
        success: true,
      });
      expect(result.file.id).toMatch(/^F-mock-/);
      expect(result.file.url).toContain("test.txt");
    });
  });

  describe("Twilio Mock Connector", () => {
    it("should send SMS without network calls", async () => {
      const connector = ConnectorFactory.create("twilio") as any;
      
      const result = await connector.sendSms({
        to: "+15555555555",
        from: "+15555551234",
        body: "Test SMS",
      });

      expect(result).toMatchObject({
        status: "sent",
      });
      expect(result.sid).toMatch(/^SM-mock-/);
      expect(result.dateCreated).toBeTruthy();
    });

    it("should validate phone number without API call", async () => {
      const connector = ConnectorFactory.create("twilio") as any;
      
      const result = await connector.validatePhoneNumber("+15555555555");

      expect(result).toMatchObject({
        phoneNumber: "+15555555555",
        valid: true,
        countryCode: "US",
      });
    });

    it("should list messages with pagination", async () => {
      const connector = ConnectorFactory.create("twilio") as any;
      
      const result = await connector.listMessages({ pageSize: 5 });

      expect(result.messages).toHaveLength(5);
      expect(result.messages[0]).toMatchObject({
        sid: "SM-mock-0",
        status: "delivered",
      });
    });
  });

  describe("Error Handling", () => {
    it("falls back to a generic mock connector when type is unknown", async () => {
      const connector = ConnectorFactory.create("unknown" as any) as any;
      const result = await connector.execute("noop", { foo: "bar" });
      expect(result).toMatchObject({
        success: true,
        connector: "unknown",
      });
    });
  });

  describe("Workspace connectors", () => {
    it("supports google-sheets mock operations", async () => {
      const connector = ConnectorFactory.create("google-sheets") as any;
      const rows = await connector.listRows("sheet-1", "A1:C3");
      expect(rows.rows.length).toBeGreaterThan(0);
      const append = await connector.appendRow("sheet-1", "Sheet1", ["A", "B"]);
      expect(append.updatedRange).toContain("Sheet1");
    });
  });

  describe("Determinism", () => {
    it("should return consistent structure across calls", async () => {
      const connector1 = ConnectorFactory.create("gmail") as any;
      const connector2 = ConnectorFactory.create("gmail") as any;

      const profile1 = await connector1.getProfile();
      const profile2 = await connector2.getProfile();

      // Same structure, same mock data
      expect(profile1).toEqual(profile2);
    });

    it("should generate unique IDs for each call", async () => {
      const connector = ConnectorFactory.create("gmail") as any;

      const result1 = await connector.send({ to: "test@example.com", subject: "Test", body: "Body" });
      const result2 = await connector.send({ to: "test@example.com", subject: "Test", body: "Body" });

      // IDs should be different (timestamp-based)
      expect(result1.id).not.toEqual(result2.id);
    });
  });
});
