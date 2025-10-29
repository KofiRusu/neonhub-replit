import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import * as tasksService from '../services/tasks.service.js';
import type { CreateTaskInput, UpdateTaskInput } from '../services/tasks.service.js';
import { ok, fail } from '../lib/http.js';

export const tasksRouter: Router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// POST /tasks - Create new task
tasksRouter.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = createTaskSchema.parse(req.body);

    const taskData: CreateTaskInput = {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      assigneeId: validatedData.assigneeId,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      tags: validatedData.tags,
      metadata: validatedData.metadata ?? {},
    };
    
    const task = await tasksService.createTask(req.user!.id, taskData);
    return res.status(201).json(ok(task));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return res.status(500).json(fail(message).body);
  }
});

// GET /tasks - List tasks
tasksRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, priority, assigneeId } = req.query;
    const filters: any = {};
    
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    
    if (priority && typeof priority === 'string') {
      filters.priority = priority;
    }
    
    if (assigneeId && typeof assigneeId === 'string') {
      filters.assigneeId = assigneeId;
    }
    
    const tasks = await tasksService.getTasks(req.user!.id, filters);
    return res.json(ok(tasks));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tasks';
    return res.status(500).json(fail(message));
  }
});

// GET /tasks/:id - Get specific task
tasksRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const task = await tasksService.getTaskById(req.params.id, req.user!.id);
    return res.json(ok(task));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch task';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /tasks/:id - Update task
tasksRouter.put('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const validatedData = updateTaskSchema.parse(req.body);

    const taskData: UpdateTaskInput = {
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      priority: validatedData.priority,
      tags: validatedData.tags,
      metadata: validatedData.metadata ?? undefined,
    };

    if (validatedData.dueDate !== undefined) {
      taskData.dueDate = validatedData.dueDate ? new Date(validatedData.dueDate) : null;
    }

    if (validatedData.assigneeId !== undefined) {
      taskData.assigneeId = validatedData.assigneeId ?? null;
    }
    
    const task = await tasksService.updateTask(req.params.id, req.user!.id, taskData);
    return res.json(ok(task));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(fail(error.errors[0].message).body);
    }
    const message = error instanceof Error ? error.message : 'Failed to update task';
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// DELETE /tasks/:id - Delete task
tasksRouter.delete('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await tasksService.deleteTask(req.params.id, req.user!.id);
    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete task';
    const status = message.includes('not found') || message.includes('unauthorized') ? 404 : 500;
    return res.status(status).json(fail(message));
  }
});

export default tasksRouter;
