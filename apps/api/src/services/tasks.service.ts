import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  assigneeId?: string;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  dueDate?: Date | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function createTask(userId: string, input: CreateTaskInput) {
  try {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority || 'medium',
        tags: input.tags || [],
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        createdById: userId,
        assigneeId: input.assigneeId,
        dueDate: input.dueDate,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ taskId: task.id, userId }, 'Task created');
    return task;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create task');
    throw error;
  }
}

export async function getTasks(userId: string, filters?: { status?: string; priority?: string; assigneeId?: string }) {
  try {
    const where: any = {
      OR: [
        { createdById: userId },
        { assigneeId: userId },
      ],
    };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.priority) {
      where.priority = filters.priority;
    }
    
    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return tasks;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch tasks');
    throw error;
  }
}

export async function getTaskById(taskId: string, userId: string) {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: userId },
          { assigneeId: userId },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  } catch (error) {
    logger.error({ error, taskId, userId }, 'Failed to fetch task');
    throw error;
  }
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  try {
    const existing = await prisma.task.findFirst({
      where: {
        id: taskId,
        OR: [
          { createdById: userId },
          { assigneeId: userId },
        ],
      },
    });

    if (!existing) {
      throw new Error('Task not found');
    }

    const updateData: any = {};
    
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'done' && !existing.completedAt) {
        updateData.completedAt = new Date();
      }
    }
    if (input.priority) updateData.priority = input.priority;
    if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate;
    if (input.tags) updateData.tags = input.tags;
    if (input.metadata) updateData.metadata = input.metadata as Prisma.InputJsonValue;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ taskId, userId }, 'Task updated');
    return task;
  } catch (error) {
    logger.error({ error, taskId, userId }, 'Failed to update task');
    throw error;
  }
}

export async function deleteTask(taskId: string, userId: string) {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        createdById: userId,
      },
    });

    if (!task) {
      throw new Error('Task not found or unauthorized');
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    logger.info({ taskId, userId }, 'Task deleted');
    return { success: true };
  } catch (error) {
    logger.error({ error, taskId, userId }, 'Failed to delete task');
    throw error;
  }
}
