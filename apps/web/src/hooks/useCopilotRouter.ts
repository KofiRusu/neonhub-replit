"use client";

import { useCallback } from "react";
import type { ActionResult, Intent, NotImplementedError, SourceRef } from "@/src/types/brand-voice";
import { http } from "@/src/lib/api";
import { r } from "@/src/lib/route-map";

// No tRPC client present in this UI package. Keep optional to avoid build-time resolution.
// If a tRPC client is added later, wire it here.
const api: unknown = undefined;

type AnyPayload = Record<string, unknown>;

function notImplemented(intent: Intent): NotImplementedError {
  return {
    kind: "NotImplementedError",
    message: `Intent '${intent}' is not wired to backend procedures yet`,
    todo:
      "Create corresponding tRPC procedure (e.g., content.generatePost, seo.runAudit, etc.) and export 'api' client.",
  };
}

export function useCopilotRouter() {
  const mapIntentToCall = useCallback(
    async (intent: Intent, payload: AnyPayload): Promise<ActionResult> => {
      const startedAt = performance.now();
      try {
        // Map intents to REST endpoints; if an endpoint 404s, surface NotImplemented
        switch (intent) {
          case "generate-post": {
            const data = await http<unknown>(r("content_generatePost"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          case "seo-audit": {
            const data = await http<unknown>(r("seo_audit"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          case "email-seq": {
            const data = await http<unknown>(r("email_sequence"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          case "support-reply": {
            const data = await http<unknown>(r("support_reply"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          case "trend-brief": {
            const data = await http<unknown>(r("trends_brief"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          case "analytics-summarize": {
            const data = await http<unknown>(r("analytics_execSummary"), {
              method: "POST",
              body: JSON.stringify(payload),
            });
            return { ok: true, data };
          }
          default: {
            const neverIntent: never = intent;
            throw new Error(`Unhandled intent: ${neverIntent}`);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (/^404\s/i.test(message)) {
          return { ok: false, error: notImplemented(intent).message } satisfies ActionResult;
        }
        return { ok: false, error: message } satisfies ActionResult;
      } finally {
        const endedAt = performance.now();
        void endedAt; // reserved for optional telemetry/logging by caller
      }
    },
    []
  );

  return { mapIntentToCall };
}

export type { Intent, ActionResult, SourceRef };


