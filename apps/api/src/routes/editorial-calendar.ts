import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { fail, ok } from "../lib/http.js";
import * as editorialService from "../services/editorial-calendar.service.js";

const router: Router = Router();

const editorialCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  publishAt: z.string().datetime({ message: "publishAt must be an ISO-8601 date string" }),
  priority: z.number().int().min(0).max(100).optional(),
  status: z.string().min(1).optional(),
  personaId: z.number().int().positive().optional(),
});

const editorialUpdateSchema = editorialCreateSchema.partial();

router.get("/", async (req: AuthRequest, res) => {
  try {
    const personaIdParam = req.query.personaId;
    const statusParam = req.query.status;
    const personaId = typeof personaIdParam === "string" ? Number(personaIdParam) : undefined;
    const status = typeof statusParam === "string" ? statusParam : undefined;

    const filters = {
      ...(personaId !== undefined && !Number.isNaN(personaId) ? { personaId } : {}),
      ...(status ? { status } : {}),
    };

    const entries = await editorialService.listEditorialEntries(filters);
    return res.json(ok(entries));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch editorial calendar";
    return res.status(500).json(fail(message).body);
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid editorial calendar id").body);
    }

    const entry = await editorialService.getEditorialEntry(id);
    if (!entry) {
      return res.status(404).json(fail("Editorial calendar entry not found").body);
    }

    return res.json(ok(entry));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch editorial calendar entry";
    return res.status(500).json(fail(message).body);
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const payload = editorialCreateSchema.parse(req.body);
    const entry = await editorialService.createEditorialEntry({
      title: payload.title,
      publishAt: new Date(payload.publishAt),
      priority: payload.priority,
      status: payload.status,
      personaId: payload.personaId,
    });
    return res.status(201).json(ok(entry));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to create editorial entry";
    return res.status(500).json(fail(message).body);
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid editorial calendar id").body);
    }

    const payload = editorialUpdateSchema.parse(req.body);
    const entry = await editorialService.updateEditorialEntry(id, {
      ...payload,
      publishAt: payload.publishAt ? new Date(payload.publishAt) : undefined,
    });
    return res.json(ok(entry));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to update editorial entry";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid editorial calendar id").body);
    }

    await editorialService.deleteEditorialEntry(id);
    return res.json(ok({ deleted: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete editorial entry";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

export default router;
