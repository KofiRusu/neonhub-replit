import { describe, it, expect } from "@jest/globals";
import { GmailConnector } from "../services/GmailConnector.js";

const connector = new GmailConnector();

describe("GmailConnector (test mode)", () => {
  it("sends mail deterministically", async () => {
    const result = await connector.actions[0].execute({
      auth: {},
      input: { to: "test@example.com", body: "Hello" }
    });

    expect(result).toHaveProperty("id");
  });

  it("returns mock messages", async () => {
    const trigger = connector.triggers[0];
    const result = await trigger.run({ auth: {}, settings: {}, cursor: null });

    expect(result.items.length).toBeGreaterThan(0);
  });
});
