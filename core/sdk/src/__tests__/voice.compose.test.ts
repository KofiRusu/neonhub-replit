import { nh } from "../index";
import { resetTransport, setTransport } from "../client";

describe("voice.compose", () => {
  afterEach(() => {
    resetTransport();
  });

  it("returns subject lines and html variants", async () => {
    setTransport(async () => ({
      subjectLines: ["a", "b", "c"],
      htmlVariants: ["<p>hi</p>"],
      body: "hi",
      meta: { model: "gpt-5" },
    }));

    const result = await nh.voice.compose({
      channel: "email",
      objective: "demo_book",
      personId: "per_1",
    });

    expect(result.subjectLines.length).toBeGreaterThan(0);
    expect(result.htmlVariants[0]).toContain("<p>");
    expect(result.body).toBe("hi");
  });
});
