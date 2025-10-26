import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import * as feedbackService from '../../services/feedback.service';

jest.mock('../../services/feedback.service');

describe('Feedback Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFeedback', () => {
    it('should create feedback successfully', async () => {
      const mockFeedback = {
        id: 'feedback_123',
        type: 'bug',
        category: 'ui',
        title: 'Button not working',
        description: 'The submit button does not work',
        rating: null,
        status: 'open',
        userId: 'user_123',
        user: {
          id: 'user_123',
          name: 'Test User',
          email: 'test@example.com',
        },
        metadata: {},
        response: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        resolvedAt: null,
      };

      (feedbackService.createFeedback as jest.MockedFunction<typeof feedbackService.createFeedback>)
        .mockResolvedValue(mockFeedback as any);

      const result = await feedbackService.createFeedback('user_123', {
        type: 'bug',
        category: 'ui',
        title: 'Button not working',
        description: 'The submit button does not work',
      });

      expect(result).toEqual(mockFeedback);
      expect(result.type).toBe('bug');
      expect(result.status).toBe('open');
    });

    it('should create feedback with rating', async () => {
      const mockFeedback = {
        id: 'feedback_123',
        type: 'feature',
        title: 'Great feature!',
        description: 'Love the new dashboard',
        rating: 5,
      };

      (feedbackService.createFeedback as jest.MockedFunction<typeof feedbackService.createFeedback>)
        .mockResolvedValue(mockFeedback as any);

      const result = await feedbackService.createFeedback('user_123', {
        type: 'feature',
        title: 'Great feature!',
        description: 'Love the new dashboard',
        rating: 5,
      });

      expect(result.rating).toBe(5);
    });

    it('should throw error for invalid rating', async () => {
      (feedbackService.createFeedback as jest.MockedFunction<typeof feedbackService.createFeedback>)
        .mockRejectedValue(new Error('Rating must be between 1 and 5'));

      await expect(
        feedbackService.createFeedback('user_123', {
          type: 'bug',
          title: 'Test',
          description: 'Test',
          rating: 10,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });
  });

  describe('getFeedback', () => {
    it('should fetch feedback for a user', async () => {
      const mockFeedback = [
        {
          id: 'feedback_1',
          type: 'bug',
          title: 'Bug 1',
          status: 'open',
        },
        {
          id: 'feedback_2',
          type: 'feature',
          title: 'Feature request',
          status: 'open',
        },
      ];

      (feedbackService.getFeedback as jest.MockedFunction<typeof feedbackService.getFeedback>)
        .mockResolvedValue(mockFeedback as any);

      const result = await feedbackService.getFeedback('user_123');

      expect(result).toHaveLength(2);
    });

    it('should filter feedback by type', async () => {
      const mockFeedback = [
        {
          id: 'feedback_1',
          type: 'bug',
          title: 'Bug Report',
        },
      ];

      (feedbackService.getFeedback as jest.MockedFunction<typeof feedbackService.getFeedback>)
        .mockResolvedValue(mockFeedback as any);

      await feedbackService.getFeedback('user_123', { type: 'bug' });

      expect(feedbackService.getFeedback).toHaveBeenCalledWith('user_123', { type: 'bug' });
    });

    it('should filter feedback by status', async () => {
      const mockFeedback = [
        {
          id: 'feedback_1',
          status: 'resolved',
        },
      ];

      (feedbackService.getFeedback as jest.MockedFunction<typeof feedbackService.getFeedback>)
        .mockResolvedValue(mockFeedback as any);

      await feedbackService.getFeedback('user_123', { status: 'resolved' });

      expect(feedbackService.getFeedback).toHaveBeenCalledWith('user_123', { status: 'resolved' });
    });
  });

  describe('updateFeedback', () => {
    it('should update feedback status', async () => {
      const mockUpdated = {
        id: 'feedback_123',
        status: 'resolved',
        resolvedAt: new Date(),
      };

      (feedbackService.updateFeedback as jest.MockedFunction<typeof feedbackService.updateFeedback>)
        .mockResolvedValue(mockUpdated as any);

      const result = await feedbackService.updateFeedback('feedback_123', {
        status: 'resolved',
      });

      expect(result.status).toBe('resolved');
      expect(result.resolvedAt).toBeDefined();
    });

    it('should add response to feedback', async () => {
      const mockUpdated = {
        id: 'feedback_123',
        response: 'Thank you for your feedback!',
      };

      (feedbackService.updateFeedback as jest.MockedFunction<typeof feedbackService.updateFeedback>)
        .mockResolvedValue(mockUpdated as any);

      const result = await feedbackService.updateFeedback('feedback_123', {
        response: 'Thank you for your feedback!',
      });

      expect(result.response).toBe('Thank you for your feedback!');
    });
  });

  describe('deleteFeedback', () => {
    it('should delete feedback successfully', async () => {
      (feedbackService.deleteFeedback as jest.MockedFunction<typeof feedbackService.deleteFeedback>)
        .mockResolvedValue({ success: true });

      const result = await feedbackService.deleteFeedback('feedback_123', 'user_123');

      expect(result).toEqual({ success: true });
    });

    it('should throw error for unauthorized deletion', async () => {
      (feedbackService.deleteFeedback as jest.MockedFunction<typeof feedbackService.deleteFeedback>)
        .mockRejectedValue(new Error('Feedback not found or unauthorized'));

      await expect(
        feedbackService.deleteFeedback('feedback_123', 'user_456')
      ).rejects.toThrow('Feedback not found or unauthorized');
    });
  });

  describe('getFeedbackStats', () => {
    it('should return feedback statistics', async () => {
      const mockStats = {
        total: 100,
        byType: {
          bug: 40,
          feature: 30,
          improvement: 20,
          question: 10,
        },
        byStatus: {
          open: 50,
          in_progress: 20,
          resolved: 25,
          closed: 5,
        },
        averageRating: 4.2,
      };

      (feedbackService.getFeedbackStats as jest.MockedFunction<typeof feedbackService.getFeedbackStats>)
        .mockResolvedValue(mockStats);

      const result = await feedbackService.getFeedbackStats();

      expect(result.total).toBe(100);
      expect(result.averageRating).toBe(4.2);
      expect(result.byType.bug).toBe(40);
    });

    it('should filter stats by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const mockStats = {
        total: 50,
        byType: {},
        byStatus: {},
        averageRating: 4.5,
      };

      (feedbackService.getFeedbackStats as jest.MockedFunction<typeof feedbackService.getFeedbackStats>)
        .mockResolvedValue(mockStats);

      await feedbackService.getFeedbackStats({ startDate, endDate });

      expect(feedbackService.getFeedbackStats).toHaveBeenCalledWith({ startDate, endDate });
    });
  });
});

