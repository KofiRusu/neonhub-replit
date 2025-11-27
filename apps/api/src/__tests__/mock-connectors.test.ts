/**
 * Mock Connectors Test Suite
 * Validates deterministic behavior of all mock connectors
 */

import { describe, it, expect } from '@jest/globals';
import {
  getMockConnector,
  useMockConnectors,
  getConnector,
  validateConnectorCredentials,
} from '../connectors/mock/index.js';

describe('Mock Connectors', () => {
  // Set USE_MOCK_CONNECTORS for tests
  beforeAll(() => {
    process.env.USE_MOCK_CONNECTORS = 'true';
  });

  describe('useMockConnectors', () => {
    it('should return true when USE_MOCK_CONNECTORS is enabled', () => {
      expect(useMockConnectors()).toBe(true);
    });
  });

  describe('MockEmailConnector', () => {
    it('should send email with deterministic response', async () => {
      const connector = getMockConnector('EMAIL');
      const result = await connector.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('messageId');
      expect(result.data).toHaveProperty('status', 'sent');
      expect(result.metadata).toHaveProperty('mock', true);
      expect(result.metadata).toHaveProperty('connectorType', 'EMAIL');
    });

    it('should list emails', async () => {
      const connector = getMockConnector('EMAIL');
      const result = await connector.listEmails({ maxResults: 10 });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('subject');
    });
  });

  describe('MockSMSConnector', () => {
    it('should send SMS with deterministic response', async () => {
      const connector = getMockConnector('SMS');
      const result = await connector.sendSMS({
        to: '+1234567890',
        body: 'Test SMS message',
      });

      expect(result.success).toBe(true);
      expect(result.data.sid).toMatch(/^SM_mock_/);
      expect(result.data.status).toBe('sent');
    });

    it('should get message status', async () => {
      const connector = getMockConnector('SMS');
      const result = await connector.getMessageStatus('SM_test123');

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('delivered');
    });
  });

  describe('MockSlackConnector', () => {
    it('should post message to channel', async () => {
      const connector = getMockConnector('SLACK');
      const result = await connector.postMessage({
        channel: 'general',
        text: 'Hello Slack!',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('ts');
      expect(result.data).toHaveProperty('channel', 'general');
    });

    it('should list channels', async () => {
      const connector = getMockConnector('SLACK');
      const result = await connector.listChannels();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
    });
  });

  describe('MockStripeConnector', () => {
    it('should create customer', async () => {
      const connector = getMockConnector('STRIPE');
      const result = await connector.createCustomer({
        email: 'customer@example.com',
        name: 'Test Customer',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toMatch(/^cus_mock_/);
      expect(result.data.email).toBe('customer@example.com');
    });

    it('should create subscription', async () => {
      const connector = getMockConnector('STRIPE');
      const result = await connector.createSubscription({
        customerId: 'cus_test123',
        priceId: 'price_test123',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toMatch(/^sub_mock_/);
      expect(result.data.status).toBe('active');
    });
  });

  describe('MockInstagramConnector', () => {
    it('should post media', async () => {
      const connector = getMockConnector('INSTAGRAM');
      const result = await connector.postMedia({
        caption: 'Test post',
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toMatch(/^ig_mock_/);
      expect(result.data.permalink).toContain('instagram.com');
    });

    it('should get insights', async () => {
      const connector = getMockConnector('INSTAGRAM');
      const result = await connector.getInsights();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('reach');
      expect(result.data).toHaveProperty('impressions');
      expect(typeof result.data.reach).toBe('number');
    });
  });

  describe('MockGoogleAdsConnector', () => {
    it('should create campaign', async () => {
      const connector = getMockConnector('GOOGLE_ADS');
      const result = await connector.createCampaign({
        name: 'Test Campaign',
        budget: 1000,
      });

      expect(result.success).toBe(true);
      expect(result.data.id).toMatch(/^campaign_mock_/);
      expect(result.data.status).toBe('ENABLED');
    });

    it('should get campaign metrics', async () => {
      const connector = getMockConnector('GOOGLE_ADS');
      const result = await connector.getCampaignMetrics('campaign_123');

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('impressions');
      expect(result.data).toHaveProperty('clicks');
      expect(result.data).toHaveProperty('cost');
    });
  });

  describe('getConnector factory', () => {
    it('should return mock connector when USE_MOCK_CONNECTORS is true', () => {
      const connector = getConnector('EMAIL', () => {
        throw new Error('Should not create real connector');
      });

      expect(connector).toBeDefined();
      expect(connector.connectorType).toBe('EMAIL');
    });

    it('should not require credentials when using mocks', () => {
      expect(() => {
        validateConnectorCredentials('EMAIL', ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET']);
      }).not.toThrow();
    });
  });

  describe('All connector types', () => {
    const connectorTypes = [
      'EMAIL',
      'SMS',
      'SLACK',
      'STRIPE',
      'WHATSAPP',
      'INSTAGRAM',
      'FACEBOOK',
      'LINKEDIN',
      'X',
      'GOOGLE_ADS',
      'GOOGLE_ANALYTICS',
      'GOOGLE_SEARCH_CONSOLE',
      'SHOPIFY',
      'DISCORD',
      'REDDIT',
      'TIKTOK',
      'YOUTUBE',
    ] as const;

    it.each(connectorTypes)('should create mock connector for %s', (type) => {
      const connector = getMockConnector(type);
      expect(connector).toBeDefined();
      expect(connector.connectorType).toBe(type);
    });
  });
});

