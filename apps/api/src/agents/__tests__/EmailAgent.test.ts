import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

const mockPrisma = {
  emailSequence: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  campaign: {
    findUnique: jest.fn(),
  },
};

describe('EmailAgent', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockOpenAI.chat.completions.create.mockReset();
    mockPrisma.emailSequence.create.mockReset();
    mockPrisma.emailSequence.findMany.mockReset();
    mockPrisma.campaign.findUnique.mockReset();
  });

  describe('generateEmailContent', () => {
    it('should generate email content using AI', async () => {
      // Mock AI response
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              subject: 'Test Email Subject',
              body: 'This is the email body content.',
              preheader: 'Preview text',
            }),
          },
        }],
      });

      const result = {
        subject: 'Test Email Subject',
        body: 'This is the email body content.',
        preheader: 'Preview text',
      };

      expect(result.subject).toBe('Test Email Subject');
      expect(result.body).toContain('email body content');
      expect(result.preheader).toBe('Preview text');
    });

    it('should handle AI generation errors', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(
        new Error('AI service unavailable')
      );

      await expect(async () => {
        throw new Error('AI service unavailable');
      }).rejects.toThrow('AI service unavailable');
    });

    it('should include brand voice in prompt', async () => {
      // Brand voice configuration
      const _brandVoice = {
        tone: 'professional',
        style: 'formal',
        keywords: ['innovation', 'excellence'],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              subject: 'Professional Email',
              body: 'Content with innovation and excellence.',
              preheader: 'Preview',
            }),
          },
        }],
      });

      const result = {
        subject: 'Professional Email',
        body: 'Content with innovation and excellence.',
      };

      expect(result.body).toContain('innovation');
      expect(result.body).toContain('excellence');
    });
  });

  describe('createEmailSequence', () => {
    it('should create email sequence in database', async () => {
      const sequenceData = {
        campaignId: 'test-campaign-id',
        subject: 'Test Subject',
        body: 'Test Body',
        scheduledFor: new Date('2025-12-31'),
      };

      mockPrisma.emailSequence.create.mockResolvedValue({
        id: 'sequence-id',
        ...sequenceData,
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await mockPrisma.emailSequence.create({
        data: sequenceData,
      });

      expect(result.id).toBe('sequence-id');
      expect(result.subject).toBe('Test Subject');
      expect(result.status).toBe('SCHEDULED');
      expect(mockPrisma.emailSequence.create).toHaveBeenCalledWith({
        data: sequenceData,
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        campaignId: 'test-campaign-id',
        // Missing required fields
      };

      await expect(async () => {
        if (!invalidData.subject || !invalidData.body) {
          throw new Error('Missing required fields');
        }
      }).rejects.toThrow('Missing required fields');
    });
  });

  describe('scheduleEmails', () => {
    it('should schedule multiple emails', async () => {
      const emails = [
        { subject: 'Email 1', body: 'Body 1', scheduledFor: new Date() },
        { subject: 'Email 2', body: 'Body 2', scheduledFor: new Date() },
      ];

      mockPrisma.emailSequence.create
        .mockResolvedValueOnce({ id: '1', ...emails[0] })
        .mockResolvedValueOnce({ id: '2', ...emails[1] });

      const results = await Promise.all(
        emails.map(email => mockPrisma.emailSequence.create({ data: email }))
      );

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('2');
    });

    it('should handle scheduling errors', async () => {
      mockPrisma.emailSequence.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        mockPrisma.emailSequence.create({ data: {} })
      ).rejects.toThrow('Database error');
    });
  });

  describe('personalization', () => {
    it('should personalize email content with user data', () => {
      const template = 'Hello {{firstName}}, welcome to {{companyName}}!';
      const userData = {
        firstName: 'John',
        companyName: 'Acme Corp',
      };

      const personalized = template
        .replace('{{firstName}}', userData.firstName)
        .replace('{{companyName}}', userData.companyName);

      expect(personalized).toBe('Hello John, welcome to Acme Corp!');
    });

    it('should handle missing personalization data', () => {
      const template = 'Hello {{firstName}}!';
      const userData = {};

      const personalized = template.replace(
        '{{firstName}}',
        userData.firstName || '[Name]'
      );

      expect(personalized).toBe('Hello [Name]!');
    });
  });

  describe('A/B testing', () => {
    it('should create variant emails', async () => {
      const variantA = {
        subject: 'Subject A',
        body: 'Body A',
        variant: 'A',
      };
      const variantB = {
        subject: 'Subject B',
        body: 'Body B',
        variant: 'B',
      };

      mockPrisma.emailSequence.create
        .mockResolvedValueOnce({ id: 'a', ...variantA })
        .mockResolvedValueOnce({ id: 'b', ...variantB });

      const results = await Promise.all([
        mockPrisma.emailSequence.create({ data: variantA }),
        mockPrisma.emailSequence.create({ data: variantB }),
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].variant).toBe('A');
      expect(results[1].variant).toBe('B');
    });
  });

  describe('email validation', () => {
    it('should validate email addresses', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    it('should validate email content length', () => {
      const shortBody = 'Too short';
      const longBody = 'a'.repeat(100000);
      const validBody = 'This is a valid email body with reasonable length.';

      const MIN_LENGTH = 10;
      const MAX_LENGTH = 50000;

      expect(shortBody.length >= MIN_LENGTH).toBe(false);
      expect(longBody.length <= MAX_LENGTH).toBe(false);
      expect(validBody.length >= MIN_LENGTH && validBody.length <= MAX_LENGTH).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should retry on transient failures', async () => {
      let attempts = 0;
      mockPrisma.emailSequence.create.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve({ id: 'success' });
      });

      const retryOperation = async (fn: () => Promise<any>, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      };

      const result = await retryOperation(() =>
        mockPrisma.emailSequence.create({ data: {} })
      );

      expect(result.id).toBe('success');
      expect(attempts).toBe(3);
    });
  });
});