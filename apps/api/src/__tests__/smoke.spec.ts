import { describe, expect, it } from "@jest/globals";
import { hashPayload } from "../services/agent-run.service.js";

describe("hashPayload", () => {
  it("produces deterministic hashes for equivalent objects", () => {
    const left = { a: 1, b: { c: "value" } };
    const right = { b: { c: "value" }, a: 1 };

    expect(hashPayload(left)).toBe(hashPayload(right));
  });

  it("handles undefined and null values without throwing", () => {
    expect(hashPayload(undefined)).toBe(hashPayload(null));
  });
});
