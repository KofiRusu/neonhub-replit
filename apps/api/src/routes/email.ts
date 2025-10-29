import { Router } from "express";
import { ok, fail } from "../lib/http";
import { sequence } from "../services/email.service";

export const emailRouter: Router = Router();

emailRouter.post("/email/sequence", async (req, res) => {
  try {
    const { topic, audience, notes } = (req.body ?? {}) as { topic?: string; audience?: string; notes?: string };
    const data = await sequence({ topic, audience, notes });
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default emailRouter;


