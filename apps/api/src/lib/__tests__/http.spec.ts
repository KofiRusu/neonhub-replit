import { describe, expect, it } from "@jest/globals";
import { ok, fail } from "../http.js";

describe("http response helpers", () => {
  it("wraps successful data payloads", () => {
    expect(ok({ id: 1 })).toEqual({ ok: true, data: { id: 1 } });

    const sources = [{ id: "doc-1", title: "Spec" }];
    expect(ok("value", sources)).toEqual({ ok: true, data: "value", sources });
  });

  it("wraps failures with status codes", () => {
    expect(fail("Not Found", 404)).toEqual({
      code: 404,
      body: { ok: false, error: "Not Found" },
    });

    expect(fail("Boom").code).toBe(500);
  });
});
