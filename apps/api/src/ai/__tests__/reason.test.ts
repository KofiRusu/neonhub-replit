import { plan, reflect, verify, route } from "../core/reason";

describe("reason core", () => {
  it("creates a deterministic plan", () => {
    const steps = plan({ objective: "Launch feature", channel: "blog" });
    expect(steps).toHaveLength(4);
    expect(steps[0].title).toContain("Understand");
  });

  it("reflects by descending impact", () => {
    const suggestions = reflect("draft", { a: 0.2, b: 0.9, c: 0.5 });
    expect(suggestions[0].change).toContain("b");
    expect(suggestions).toHaveLength(3);
  });

  it("verifies with custom policy", () => {
    const result = verify("ok", { validator: () => [] });
    expect(result.ok).toBe(true);
  });

  it("routes based on channel", () => {
    const agent = route({ objective: "Write email", channel: "email" }, { EmailAgent: 1 });
    expect(agent).toBe("EmailAgent");
  });
});
