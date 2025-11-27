import { describe, expect, it } from "@jest/globals";
import { connectById, mapJsonExtras, teamUniqueWhere } from "../mappers.js";

describe("Prisma mapper helpers", () => {
  it("connectById returns connect clause when id provided", () => {
    expect(connectById("agent-1")).toEqual({ connect: { id: "agent-1" } });
    expect(connectById(null)).toBeUndefined();
  });

  it("maps json extras excluding explicit keys", () => {
    const payload = { keep: "value", extra: 1, other: undefined };
    expect(mapJsonExtras(payload, ["keep"])).toEqual({ metadata: { extra: 1 } });
    expect(mapJsonExtras({}, ["keep"])).toBeUndefined();
    expect(mapJsonExtras(null, ["keep"])).toBeUndefined();
  });

  it("builds unique where clause for teams", () => {
    expect(teamUniqueWhere({ slug: "slug-1" })).toEqual({ slug: "slug-1" });
    expect(teamUniqueWhere({ organizationId: "org", name: "Team" })).toEqual({
      organizationId_name: { organizationId: "org", name: "Team" },
    });
    expect(() => teamUniqueWhere({})).toThrow("teamUniqueWhere requires a slug or an organizationId/name pair");
  });
});
