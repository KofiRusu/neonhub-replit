import { Router } from "express";
import { z } from "zod";
import type { AuthRequest } from "../middleware/auth.js";
import { fail, ok } from "../lib/http.js";
import * as personaService from "../services/persona.service.js";

const router: Router = Router();

const personaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  summary: z.string().max(2000).optional(),
});

const personaUpdateSchema = personaSchema.partial();

router.get("/", async (_req: AuthRequest, res) => {
  try {
    const personas = await personaService.listPersonas();
    return res.json(ok(personas));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch personas";
    return res.status(500).json(fail(message).body);
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid persona id").body);
    }

    const persona = await personaService.getPersonaById(id);
    if (!persona) {
      return res.status(404).json(fail("Persona not found").body);
    }

    return res.json(ok(persona));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch persona";
    return res.status(500).json(fail(message).body);
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const payload = personaSchema.parse(req.body);
    const persona = await personaService.createPersona({
      name: payload.name,
      summary: payload.summary ?? null,
    });
    return res.status(201).json(ok(persona));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to create persona";
    return res.status(500).json(fail(message).body);
  }
});

router.put("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid persona id").body);
    }

    const payload = personaUpdateSchema.parse(req.body);
    const persona = await personaService.updatePersona(id, payload);
    return res.json(ok(persona));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0]?.message ?? "Invalid request body").body);
    }
    const message = error instanceof Error ? error.message : "Failed to update persona";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

router.delete("/:id", async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json(fail("Invalid persona id").body);
    }

    await personaService.deletePersona(id);
    return res.json(ok({ deleted: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete persona";
    const status = message.toLowerCase().includes("not found") ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

export default router;
