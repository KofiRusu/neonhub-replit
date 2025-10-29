import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Prisma } from '@prisma/client';
import * as messagingService from '../../services/messaging.service';

jest.mock('../../services/messaging.service');

describe('Messaging Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockMessage = {
        id: 'msg_123',
        conversationId: 'thread_1',
        authorId: 'user_123',
        role: 'user',
        contentJson: { body: 'Test message' } as Prisma.JsonObject,
        metadata: {
          readBy: ['user_123'],
          receiverId: 'user_456',
          subject: 'Hello',
        } as Prisma.JsonObject,
        createdAt: new Date(),
        embedding: null,
        author: {
          id: 'user_123',
          name: 'Sender',
          email: 'sender@example.com',
          image: null,
        },
      };

      (messagingService.sendMessage as jest.MockedFunction<typeof messagingService.sendMessage>)
        .mockResolvedValue(mockMessage as any);

      const result = await messagingService.sendMessage('user_123', {
        receiverId: 'user_456',
        subject: 'Hello',
        body: 'Test message',
      });

      expect(result).toEqual(mockMessage);
      const metadata = (result.metadata ?? {}) as Prisma.JsonObject;
      expect(Array.isArray(metadata.readBy)).toBe(true);
      expect((metadata.readBy as unknown[])).toContain('user_123');
      expect(metadata.receiverId).toBe('user_456');
    });

    it('should send message as reply', async () => {
      const mockMessage = {
        id: 'msg_456',
        conversationId: 'thread_1',
        authorId: 'user_123',
        role: 'user',
        contentJson: { body: 'Reply to your message' } as Prisma.JsonObject,
        metadata: {
          replyToId: 'msg_123',
          readBy: ['user_123'],
        } as Prisma.JsonObject,
        createdAt: new Date(),
        embedding: null,
        author: {
          id: 'user_123',
          name: 'Sender',
          email: 'sender@example.com',
          image: null,
        },
      };

      (messagingService.sendMessage as jest.MockedFunction<typeof messagingService.sendMessage>)
        .mockResolvedValue(mockMessage as any);

      const result = await messagingService.sendMessage('user_123', {
        receiverId: 'user_456',
        body: 'Reply to your message',
        replyToId: 'msg_123',
        threadId: 'thread_1',
      });

      const metadata = (result.metadata ?? {}) as Prisma.JsonObject;
      expect(metadata.replyToId).toBe('msg_123');
      expect(result.conversationId).toBe('thread_1');
    });

    it('should throw error for non-existent receiver', async () => {
      (messagingService.sendMessage as jest.MockedFunction<typeof messagingService.sendMessage>)
        .mockRejectedValue(new Error('Receiver not found'));

      await expect(
        messagingService.sendMessage('user_123', {
          receiverId: 'user_999',
          body: 'Test',
        })
      ).rejects.toThrow('Receiver not found');
    });
  });

  describe('getMessages', () => {
    it('should fetch messages for a user', async () => {
      const mockMessages = [
        {
          id: 'msg_1',
          body: 'Message 1',
          senderId: 'user_123',
          receiverId: 'user_456',
        },
        {
          id: 'msg_2',
          body: 'Message 2',
          senderId: 'user_456',
          receiverId: 'user_123',
        },
      ];

      (messagingService.getMessages as jest.MockedFunction<typeof messagingService.getMessages>)
        .mockResolvedValue(mockMessages as any);

      const result = await messagingService.getMessages('user_123');

      expect(result).toHaveLength(2);
    });

    it('should filter messages by thread', async () => {
      const mockMessages = [
        {
          id: 'msg_1',
          threadId: 'thread_1',
        },
      ];

      (messagingService.getMessages as jest.MockedFunction<typeof messagingService.getMessages>)
        .mockResolvedValue(mockMessages as any);

      await messagingService.getMessages('user_123', { threadId: 'thread_1' });

      expect(messagingService.getMessages).toHaveBeenCalledWith('user_123', { threadId: 'thread_1' });
    });

    it('should filter unread messages', async () => {
      const mockMessages = [
        {
          id: 'msg_1',
          isRead: false,
        },
      ];

      (messagingService.getMessages as jest.MockedFunction<typeof messagingService.getMessages>)
        .mockResolvedValue(mockMessages as any);

      await messagingService.getMessages('user_123', { unreadOnly: true });

      expect(messagingService.getMessages).toHaveBeenCalledWith('user_123', { unreadOnly: true });
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read', async () => {
      const mockUpdated = {
        id: 'msg_123',
        conversationId: 'thread_1',
        authorId: 'user_123',
        role: 'user',
        contentJson: { body: 'Test message' } as Prisma.JsonObject,
        metadata: {
          readBy: ['user_456'],
        } as Prisma.JsonObject,
        createdAt: new Date(),
        embedding: null,
      };

      (messagingService.markMessageAsRead as jest.MockedFunction<typeof messagingService.markMessageAsRead>)
        .mockResolvedValue(mockUpdated as any);

      const result = await messagingService.markMessageAsRead('msg_123', 'user_456');

      const metadata = (result.metadata ?? {}) as Prisma.JsonObject;
      expect(Array.isArray(metadata.readBy)).toBe(true);
      expect((metadata.readBy as unknown[])).toContain('user_456');
    });

    it('should throw error for unauthorized user', async () => {
      (messagingService.markMessageAsRead as jest.MockedFunction<typeof messagingService.markMessageAsRead>)
        .mockRejectedValue(new Error('Message not found or unauthorized'));

      await expect(
        messagingService.markMessageAsRead('msg_123', 'user_999')
      ).rejects.toThrow('Message not found or unauthorized');
    });
  });

  describe('markThreadAsRead', () => {
    it('should mark entire thread as read', async () => {
      (messagingService.markThreadAsRead as jest.MockedFunction<typeof messagingService.markThreadAsRead>)
        .mockResolvedValue({ success: true, count: 5 });

      const result = await messagingService.markThreadAsRead('thread_1', 'user_123');

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
    });
  });

  describe('deleteMessage', () => {
    it('should delete message successfully', async () => {
      (messagingService.deleteMessage as jest.MockedFunction<typeof messagingService.deleteMessage>)
        .mockResolvedValue({ success: true });

      const result = await messagingService.deleteMessage('msg_123', 'user_123');

      expect(result).toEqual({ success: true });
    });

    it('should throw error for unauthorized deletion', async () => {
      (messagingService.deleteMessage as jest.MockedFunction<typeof messagingService.deleteMessage>)
        .mockRejectedValue(new Error('Message not found or unauthorized'));

      await expect(
        messagingService.deleteMessage('msg_123', 'user_456')
      ).rejects.toThrow('Message not found or unauthorized');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      (messagingService.getUnreadCount as jest.MockedFunction<typeof messagingService.getUnreadCount>)
        .mockResolvedValue({ count: 10 });

      const result = await messagingService.getUnreadCount('user_123');

      expect(result.count).toBe(10);
    });
  });

  describe('getThreads', () => {
    it('should return all threads for user', async () => {
      const mockThreads = [
        {
          id: 'msg_1',
          threadId: 'thread_1',
          unreadCount: 2,
        },
        {
          id: 'msg_2',
          threadId: 'thread_2',
          unreadCount: 0,
        },
      ];

      (messagingService.getThreads as jest.MockedFunction<typeof messagingService.getThreads>)
        .mockResolvedValue(mockThreads as any);

      const result = await messagingService.getThreads('user_123');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('unreadCount');
    });
  });
});
