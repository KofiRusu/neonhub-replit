import { Router } from "express";
import { ok, fail } from "../lib/http";
import { reply } from "../services/support.service";

export const supportRouter = Router();

supportRouter.post("/support/reply", async (req, res) => {
  try {
    const { notes } = (req.body ?? {}) as { notes?: string };
    const data = await reply({ notes });
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default supportRouter;


