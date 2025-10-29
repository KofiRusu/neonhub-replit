import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import * as documentsService from "../services/documents.service.js";
import type { CreateDocumentInput, UpdateDocumentInput } from "../services/documents.service.js";
import { ok, fail } from "../lib/http.js";

export const documentsRouter: Router = Router();

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string(),
  type: z.enum(['general', 'contract', 'proposal', 'report']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: z.enum(['general', 'contract', 'proposal', 'report']).optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /documents - Create new document
documentsRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = createDocumentSchema.parse(req.body) as CreateDocumentInput;
    const document = await documentsService.createDocument(req.user!.id, validatedData);
    return res.status(201).json(ok(document));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to create document';
    return res.status(500).json(fail(message).body);
  }
});

// GET /documents - List documents
documentsRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, type } = req.query;
    const filters: any = {};
    
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    
    if (type && typeof type === 'string') {
      filters.type = type;
    }
    
    const documents = await documentsService.getDocuments(req.user!.id, filters);
    return res.json(ok(documents));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch documents';
    return res.status(500).json(fail(message));
  }
});

// GET /documents/:id - Get specific document
documentsRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const document = await documentsService.getDocumentById(req.params.id, req.user!.id);
    return res.json(ok(document));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /documents/:id - Update document
documentsRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = updateDocumentSchema.parse(req.body) as UpdateDocumentInput;
    const document = await documentsService.updateDocument(req.params.id, req.user!.id, validatedData);
    return res.json(ok(document));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to update document';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// POST /documents/:id/version - Create new version
documentsRouter.post('/:id/version', requireAuth, async (req: AuthRequest, res) => {
  try {
    const newVersion = await documentsService.createDocumentVersion(req.params.id, req.user!.id);
    return res.status(201).json(ok(newVersion));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create document version';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// DELETE /documents/:id - Delete document
documentsRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await documentsService.deleteDocument(req.params.id, req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete document';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message));
  }
});

export default documentsRouter;
