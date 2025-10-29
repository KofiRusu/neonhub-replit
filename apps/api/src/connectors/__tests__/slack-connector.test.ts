import { describe, it, expect } from "@jest/globals";
import { SlackConnector } from "../services/SlackConnector.js";

const connector = new SlackConnector();

describe("SlackConnector (test mode)", () => {
  it("sends messages without network access", async () => {
    const result = await connector.actions[0].execute({
      auth: {},
      input: { channel: "C123", text: "Hello from tests" }
    });

    expect(result).toHaveProperty("ts");
  });

  it("provides mock history for triggers", async () => {
    const trigger = connector.triggers[0];
    const result = await trigger.run({ auth: {}, settings: { channel: "C123" }, cursor: null });

    expect(result.items).not.toHaveLength(0);
  });
});
