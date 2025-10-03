import { Router } from "express";
import { ok, fail } from "../lib/http";
import { brief } from "../services/trends.service";

export const trendsRouter = Router();

trendsRouter.post("/trends/brief", async (req, res) => {
  try {
    const { notes } = (req.body ?? {}) as { notes?: string };
    const data = await brief({ notes });
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default trendsRouter;


