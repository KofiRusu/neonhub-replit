import { Router } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import * as feedbackService from "../services/feedback.service.js";
import type { CreateFeedbackInput, UpdateFeedbackInput } from "../services/feedback.service.js";
import { ok, fail } from "../lib/http.js";

export const feedbackRouter = Router();

// Validation schemas
const createFeedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'question']),
  category: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  rating: z.number().int().min(1).max(5).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateFeedbackSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  response: z.string().optional(),
});

// POST /feedback - Submit feedback
feedbackRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = createFeedbackSchema.parse(req.body) as CreateFeedbackInput;
    const feedback = await feedbackService.createFeedback(req.user!.id, validatedData);
    return res.status(201).json(ok(feedback));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to create feedback';
    return res.status(500).json(fail(message).body);
  }
});

// GET /feedback - List feedback
feedbackRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type, status, category, allUsers } = req.query;
    
    // Only allow viewing all feedback if user is admin/beta user
    const userId = allUsers === 'true' && req.user!.isBetaUser ? undefined : req.user!.id;
    
    const filters: any = {};
    
    if (type && typeof type === 'string') {
      filters.type = type;
    }
    
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    
    if (category && typeof category === 'string') {
      filters.category = category;
    }
    
    const feedback = await feedbackService.getFeedback(userId, filters);
    return res.json(ok(feedback));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch feedback';
    return res.status(500).json(fail(message));
  }
});

// GET /feedback/stats - Get feedback statistics
feedbackRouter.get('/stats', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Only beta users can view stats
    if (!req.user!.isBetaUser) {
      return res.status(403).json(fail('Unauthorized'));
    }
    
    const { startDate, endDate } = req.query;
    const filters: any = {};
    
    if (startDate && typeof startDate === 'string') {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate && typeof endDate === 'string') {
      filters.endDate = new Date(endDate);
    }
    
    const stats = await feedbackService.getFeedbackStats(filters);
    return res.json(ok(stats));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch feedback stats';
    return res.status(500).json(fail(message));
  }
});

// GET /feedback/:id - Get specific feedback
feedbackRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const feedback = await feedbackService.getFeedbackById(req.params.id);
    
    // Check authorization - only owner or beta users can view
    if (feedback.userId !== req.user!.id && !req.user!.isBetaUser) {
      return res.status(403).json(fail('Unauthorized'));
    }
    
    return res.json(ok(feedback));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch feedback';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /feedback/:id - Update feedback (admin only)
feedbackRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    // Only beta users can update feedback status/response
    if (!req.user!.isBetaUser) {
      return res.status(403).json(fail('Unauthorized'));
    }
    
    const validatedData = updateFeedbackSchema.parse(req.body) as UpdateFeedbackInput;
    const feedback = await feedbackService.updateFeedback(req.params.id, validatedData);
    return res.json(ok(feedback));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to update feedback';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// DELETE /feedback/:id - Delete feedback
feedbackRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await feedbackService.deleteFeedback(req.params.id, req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete feedback';
    const status = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
    return res.status(status).json(fail(message));
  }
});

export default feedbackRouter;
