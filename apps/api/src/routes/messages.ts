import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import * as messagingService from '../services/messaging.service.js';
import type { CreateMessageInput } from '../services/messaging.service.js';
import { ok, fail } from '../lib/http.js';

export const messagesRouter = Router();

// Validation schemas
const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  subject: z.string().optional(),
  body: z.string().min(1, 'Message body is required'),
  threadId: z.string().optional(),
  replyToId: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /messages - Send message
messagesRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body) as CreateMessageInput;
    const message = await messagingService.sendMessage(req.user!.id, validatedData);
    return res.status(201).json(ok(message));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to send message';
    return res.status(500).json(fail(message).body);
  }
});

// GET /messages - List messages
messagesRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { threadId, unreadOnly } = req.query;
    const filters: any = {};
    
    if (threadId && typeof threadId === 'string') {
      filters.threadId = threadId;
    }
    
    if (unreadOnly === 'true') {
      filters.unreadOnly = true;
    }
    
    const messages = await messagingService.getMessages(req.user!.id, filters);
    return res.json(ok(messages));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch messages';
    return res.status(500).json(fail(message).body);
  }
});

// GET /messages/threads - List threads
messagesRouter.get('/threads', requireAuth, async (req: AuthRequest, res) => {
  try {
    const threads = await messagingService.getThreads(req.user!.id);
    return res.json(ok(threads));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch threads';
    return res.status(500).json(fail(message).body);
  }
});

// GET /messages/unread-count - Get unread message count
messagesRouter.get('/unread-count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await messagingService.getUnreadCount(req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get unread count';
    return res.status(500).json(fail(message));
  }
});

// GET /messages/:id - Get specific message
messagesRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const message = await messagingService.getMessageById(req.params.id, req.user!.id);
    return res.json(ok(message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch message';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /messages/:id/read - Mark message as read
messagesRouter.put('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const message = await messagingService.markMessageAsRead(req.params.id, req.user!.id);
    return res.json(ok(message));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark message as read';
    const status = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /messages/threads/:threadId/read - Mark thread as read
messagesRouter.put('/threads/:threadId/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await messagingService.markThreadAsRead(req.params.threadId, req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mark thread as read';
    return res.status(500).json(fail(message).body);
  }
});

// DELETE /messages/:id - Delete message
messagesRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await messagingService.deleteMessage(req.params.id, req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete message';
    const status = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
    return res.status(status).json(fail(message));
  }
});

export default messagesRouter;
