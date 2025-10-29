import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { fail, ok } from "../lib/http.js";
import * as keywordService from "../services/keyword.service.js";

const router: Router = Router();

const keywordSchema = z.object({
  term: z.string().min(1, "Keyword term is required"),
  intent: z.string().min(1, "Search intent is required"),
  priority: z.number().int().min(0).max(100).optional(),
  personaId: z.number().int().positive().optional(),
});

const keywordUpdateSchema = keywordSchema.partial();

router.get("/", async (req: AuthRequest, res) => {
  try {
    const personaIdParam = req.query.personaId;
    const personaId = typeof personaIdParam === "string" ? Number(personaIdParam) : undefined;
    const filters = Number.isNaN(personaId) ? {} : { personaId };
    const keywords = await keywordService.listKeywords(filters);
    return res.json(ok(keywords));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch keywords";
    return res.status(500).json(fail(message).body);
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid keyword id").body);
    }

    const keyword = await keywordService.getKeyword(id);
    if (!keyword) {
      return res.status(404).json(fail("Keyword not found").body);
    }

    return res.json(ok(keyword));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch keyword";
    return res.status(500).json(fail(message).body);
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const payload = keywordSchema.parse(req.body);
    const keyword = await keywordService.createKeyword({
      term: payload.term,
      intent: payload.intent,
      priority: payload.priority ?? null,
      personaId: payload.personaId ?? null,
    });
    return res.status(201).json(ok(keyword));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to create keyword";
    return res.status(500).json(fail(message).body);
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid keyword id").body);
    }

    const payload = keywordUpdateSchema.parse(req.body);
    const keyword = await keywordService.updateKeyword(id, payload);
    return res.json(ok(keyword));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to update keyword";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid keyword id").body);
    }

    await keywordService.deleteKeyword(id);
    return res.json(ok({ deleted: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete keyword";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

export default router;
