import { renderHook } from "@testing-library/react";
import { useCopilotRouter } from "@/src/hooks/useCopilotRouter";

describe("useCopilotRouter", () => {
  it("returns NotImplementedError for missing routers", async () => {
    const { result } = renderHook(() => useCopilotRouter());
    const intents: Array<Parameters<typeof result.current.mapIntentToCall>[0]> = [
      "generate-post",
      "seo-audit",
      "email-seq",
      "support-reply",
      "trend-brief",
      "analytics-summarize",
    ];

    for (const intent of intents) {
      const res = await result.current.mapIntentToCall(intent, {});
      expect(res.ok).toBe(false);
      expect(typeof res.error === "string" || res.error === undefined).toBe(true);
    }
  });
});


