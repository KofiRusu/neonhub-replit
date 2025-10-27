import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateFeedbackInput {
  type: string;
  category?: string;
  title: string;
  description: string;
  rating?: number;
  metadata?: Record<string, unknown>;
}

export interface UpdateFeedbackInput {
  status?: string;
  response?: string;
}

export async function createFeedback(userId: string, input: CreateFeedbackInput) {
  try {
    // Validate rating if provided
    if (input.rating !== undefined && (input.rating < 1 || input.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const feedback = await prisma.feedback.create({
      data: {
        type: input.type,
        category: input.category,
        title: input.title,
        description: input.description,
        rating: input.rating,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ feedbackId: feedback.id, userId, type: input.type }, 'Feedback created');
    return feedback;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to create feedback');
    throw error;
  }
}

export async function getFeedback(userId?: string, filters?: { type?: string; status?: string; category?: string }) {
  try {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.category) {
      where.category = filters.category;
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return feedback;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch feedback');
    throw error;
  }
}

export async function getFeedbackById(feedbackId: string) {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new Error('Feedback not found');
    }

    return feedback;
  } catch (error) {
    logger.error({ error, feedbackId }, 'Failed to fetch feedback');
    throw error;
  }
}

export async function updateFeedback(feedbackId: string, input: UpdateFeedbackInput) {
  try {
    const updateData: any = {};
    
    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'resolved' || input.status === 'closed') {
        updateData.resolvedAt = new Date();
      }
    }
    
    if (input.response) {
      updateData.response = input.response;
    }

    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info({ feedbackId, status: input.status }, 'Feedback updated');
    return feedback;
  } catch (error) {
    logger.error({ error, feedbackId }, 'Failed to update feedback');
    throw error;
  }
}

export async function deleteFeedback(feedbackId: string, userId: string) {
  try {
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        userId,
      },
    });

    if (!feedback) {
      throw new Error('Feedback not found or unauthorized');
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    logger.info({ feedbackId, userId }, 'Feedback deleted');
    return { success: true };
  } catch (error) {
    logger.error({ error, feedbackId, userId }, 'Failed to delete feedback');
    throw error;
  }
}

export async function getFeedbackStats(filters?: { startDate?: Date; endDate?: Date }) {
  try {
    const where: any = {};
    
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [total, byType, byStatus, avgRating] = await Promise.all([
      prisma.feedback.count({ where }),
      prisma.feedback.groupBy({
        by: ['type'],
        where,
        _count: true,
      }),
      prisma.feedback.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      prisma.feedback.aggregate({
        where: {
          ...where,
          rating: { not: null },
        },
        _avg: { rating: true },
      }),
    ]);

    return {
      total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item.type]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      averageRating: avgRating._avg.rating || 0,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch feedback stats');
    throw error;
  }
}
