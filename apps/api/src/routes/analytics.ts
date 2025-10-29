import { Router } from "express";
import { ok, fail } from "../lib/http";
import { executiveSummary, brandVoiceKpis } from "../services/analytics.service";

export const analyticsRouter: Router = Router();

analyticsRouter.post("/analytics/executive-summary", async (req, res) => {
  try {
    const { notes } = (req.body ?? {}) as { notes?: string };
    const data = executiveSummary(notes);
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

analyticsRouter.get("/analytics/brand-voice-kpis", async (_req, res) => {
  try {
    const data = brandVoiceKpis();
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default analyticsRouter;


