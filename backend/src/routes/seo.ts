import { Router } from "express";
import { ok, fail } from "../lib/http";
import { audit } from "../services/seo.service";

export const seoRouter = Router();

seoRouter.post("/seo/audit", async (req, res) => {
  try {
    const { url, notes } = (req.body ?? {}) as { url?: string; notes?: string };
    if (!url) return res.status(400).json(fail("url required", 400).body);
    const data = await audit({ url, notes });
    return res.json(ok(data));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default seoRouter;


