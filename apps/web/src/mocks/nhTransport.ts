import type { Transport } from "@neonhub/sdk/client";

/**
 * Mock NeonHub transport so the UI can integrate with the SDK
 * before the backend endpoints are ready.
 */
export const mockTransport: Transport = async ({ url, method, body }) => {
  const path = safePath(url);

  if (path === "/brand-voice/compose" && method === "POST") {
    return {
      subjectLines: [
        "Quick question about your workflow",
        "Idea for saving 3 hrs/week",
      ],
      htmlVariants: [
        "<p>hey {{firstName}}, quick one…</p>",
        "<p>got a fast win for your nurture flow—want it?</p>",
      ],
      textVariants: [
        "hey! got 30s for a quick idea on trimming your reporting time?",
        "promise this takes less than a minute and could unlock your nurture goal.",
      ],
      body:
        "hey! got 30s for a quick idea on trimming your reporting time?",
      meta: {
        model: "gpt-5-mock",
        source: "sdk-mock",
      },
    };
  }

  if (path === "/events/timeline" && method === "GET") {
    return {
      events: [],
    };
  }

  if (path === "/send/sms" && method === "POST") {
    return {
      id: "sms_mock_1",
      status: "queued",
      channel: "sms",
      metadata: {
        source: "sdk-mock",
      },
    };
  }

  return {
    ok: true,
    url: path,
    method,
    body,
  };
};

const safePath = (input: string): string => {
  try {
    const parsed = new URL(input, "http://localhost");
    return parsed.pathname;
  } catch (_err) {
    return input;
  }
};
