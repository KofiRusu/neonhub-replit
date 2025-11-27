import { describe, expect, it } from "@jest/globals";
import { hmacValid } from "../hmac.js";

describe("hmac validation", () => {
  it("returns false when signature or secret is missing", () => {
    expect(hmacValid("payload", undefined, "secret")).toBe(false);
    expect(hmacValid("payload", "signature", undefined)).toBe(false);
  });

  it("validates signatures using timing-safe comparison", async () => {
    const secret = "my-secret";
    const payload = "hello world";
    const crypto = await import("crypto");
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    expect(hmacValid(payload, signature, secret)).toBe(true);
    expect(hmacValid(payload, signature.slice(0, -2) + "ff", secret)).toBe(false);
  });

  it("fails when digests lengths differ", () => {
    expect(hmacValid("body", "short", "secret")).toBe(false);
  });
});
