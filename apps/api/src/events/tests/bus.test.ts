import { describe, it, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../../services/learning/index.js", () => ({
  learnFrom: jest.fn(async () => undefined),
}));

import { publish, subscribe } from "../bus.js";
import { learnFrom } from "../../services/learning/index.js";

const feedbackEvent = {
  sourceAgent: "AdAgent" as const,
  channel: "email" as const,
  kind: "open" as const,
  text: "User opened the onboarding email"
};

describe("Feedback bus", () => {
  beforeEach(() => {
    (learnFrom as jest.Mock).mockClear();
  });

  it("invokes subscribers before delegating to learning loop", async () => {
    const handler = jest.fn();
    const unsubscribe = subscribe(handler);

    await publish(feedbackEvent);

    expect(handler).toHaveBeenCalledWith(feedbackEvent);
    expect(learnFrom).toHaveBeenCalledWith(feedbackEvent);

    unsubscribe();
  });
});
