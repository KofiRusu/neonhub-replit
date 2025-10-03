import { Router } from "express";
import { ok, fail } from "../lib/http";
import { getBrandProfile, searchKnowledge } from "../services/brandVoice.service";

export const brandVoiceRouter = Router();

brandVoiceRouter.get("/brand-voice/profile", async (_req, res) => {
  try {
    const data = await getBrandProfile();
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

brandVoiceRouter.get("/brand-voice/search", async (req, res) => {
  try {
    const { q, type, agent } = req.query as { q?: string; type?: string; agent?: string };
    const data = await searchKnowledge(q ?? "", { type, agent });
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

brandVoiceRouter.get("/health/brand-voice", async (_req, res) => {
  try {
    const routes = [
      "content/generate-post",
      "seo/audit",
      "email/sequence",
      "support/reply",
      "trends/brief",
      "analytics/executive-summary",
      "brand-voice/profile",
      "brand-voice/search",
      "analytics/brand-voice-kpis",
    ];
    return res.json(ok({ routes }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default brandVoiceRouter;


