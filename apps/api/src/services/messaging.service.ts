import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateMessageInput {
  receiverId: string;
  subject?: string;
  body: string;
  threadId?: string;
  replyToId?: string;
  attachments?: string[];
  metadata?: Record<string, unknown>;
}

export async function sendMessage(senderId: string, input: CreateMessageInput) {
  try {
    // Validate receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: input.receiverId },
    });

    if (!receiver) {
      throw new Error('Receiver not found');
    }

    const message = await prisma.message.create({
      data: {
        subject: input.subject,
        body: input.body,
        senderId,
        receiverId: input.receiverId,
        threadId: input.threadId,
        replyToId: input.replyToId,
        attachments: input.attachments || [],
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info({ messageId: message.id, senderId, receiverId: input.receiverId }, 'Message sent');
    return message;
  } catch (error) {
    logger.error({ error, senderId, receiverId: input.receiverId }, 'Failed to send message');
    throw error;
  }
}

export async function getMessages(userId: string, filters?: { threadId?: string; unreadOnly?: boolean }) {
  try {
    const where: any = {
      OR: [
        { senderId: userId },
        { receiverId: userId },
      ],
    };
    
    if (filters?.threadId) {
      where.threadId = filters.threadId;
    }
    
    if (filters?.unreadOnly) {
      where.receiverId = userId;
      where.isRead = false;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return messages;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch messages');
    throw error;
  }
}

export async function getMessageById(messageId: string, userId: string) {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Mark as read if user is the receiver
    if (message.receiverId === userId && !message.isRead) {
      await markMessageAsRead(messageId, userId);
    }

    return message;
  } catch (error) {
    logger.error({ error, messageId, userId }, 'Failed to fetch message');
    throw error;
  }
}

export async function markMessageAsRead(messageId: string, userId: string) {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        receiverId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info({ messageId, userId }, 'Message marked as read');
    return updated;
  } catch (error) {
    logger.error({ error, messageId, userId }, 'Failed to mark message as read');
    throw error;
  }
}

export async function markThreadAsRead(threadId: string, userId: string) {
  try {
    const result = await prisma.message.updateMany({
      where: {
        threadId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    logger.info({ threadId, userId, count: result.count }, 'Thread marked as read');
    return { success: true, count: result.count };
  } catch (error) {
    logger.error({ error, threadId, userId }, 'Failed to mark thread as read');
    throw error;
  }
}

export async function deleteMessage(messageId: string, userId: string) {
  try {
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        senderId: userId,
      },
    });

    if (!message) {
      throw new Error('Message not found or unauthorized');
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    logger.info({ messageId, userId }, 'Message deleted');
    return { success: true };
  } catch (error) {
    logger.error({ error, messageId, userId }, 'Failed to delete message');
    throw error;
  }
}

export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return { count };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get unread count');
    throw error;
  }
}

export async function getThreads(userId: string) {
  try {
    // Get unique threads where user is involved
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        threadId: { not: null },
      },
      distinct: ['threadId'],
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Get unread counts per thread
    const threadsWithCounts = await Promise.all(
      messages.map(async (msg) => {
        const unreadCount = await prisma.message.count({
          where: {
            threadId: msg.threadId!,
            receiverId: userId,
            isRead: false,
          },
        });

        return {
          ...msg,
          unreadCount,
        };
      })
    );

    return threadsWithCounts;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to fetch threads');
    throw error;
  }
}
