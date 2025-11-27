/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Mock Connector Base Class
 * Provides deterministic responses for testing without real credentials
 */

export interface ConnectorResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

export abstract class MockConnector {
  protected connectorType: string;

  constructor(connectorType: string) {
    this.connectorType = connectorType;
  }

  protected mockResponse<T>(data: T): ConnectorResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        mock: true,
        connectorType: this.connectorType,
        timestamp: new Date().toISOString(),
      },
    };
  }

  protected mockError(message: string): ConnectorResponse {
    return {
      success: false,
      error: message,
      metadata: {
        mock: true,
        connectorType: this.connectorType,
      },
    };
  }

  // Simulate network delay for realistic testing
  protected async delay(ms: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Mock Email Connector (Gmail)
 */
export class MockEmailConnector extends MockConnector {
  constructor() {
    super('EMAIL');
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    body: string;
    from?: string;
  }): Promise<ConnectorResponse<{ messageId: string; status: string }>> {
    await this.delay(150);
    void params;
    return this.mockResponse({
      messageId: `mock-email-${Date.now()}`,
      status: 'sent',
    });
  }

  async listEmails(params: {
    maxResults?: number;
    query?: string;
  }): Promise<ConnectorResponse<Array<{ id: string; subject: string; from: string }>>> {
    await this.delay(200);
    return this.mockResponse([
      {
        id: 'mock-email-1',
        subject: 'Test Email 1',
        from: 'sender1@example.com',
      },
      {
        id: 'mock-email-2',
        subject: 'Test Email 2',
        from: 'sender2@example.com',
      },
    ]);
  }
}

/**
 * Mock SMS Connector (Twilio)
 */
export class MockSMSConnector extends MockConnector {
  constructor() {
    super('SMS');
  }

  async sendSMS(params: {
    to: string;
    body: string;
    from?: string;
  }): Promise<ConnectorResponse<{ sid: string; status: string }>> {
    await this.delay(120);
    return this.mockResponse({
      sid: `SM_mock_${Date.now()}`,
      status: 'sent',
    });
  }

  async getMessageStatus(sid: string): Promise<ConnectorResponse<{ sid: string; status: string }>> {
    await this.delay(50);
    return this.mockResponse({
      sid,
      status: 'delivered',
    });
  }
}

/**
 * Mock Slack Connector
 */
export class MockSlackConnector extends MockConnector {
  constructor() {
    super('SLACK');
  }

  async postMessage(params: {
    channel: string;
    text: string;
    blocks?: any[];
  }): Promise<ConnectorResponse<{ ts: string; channel: string }>> {
    await this.delay(100);
    return this.mockResponse({
      ts: `${Date.now()}.000000`,
      channel: params.channel,
    });
  }

  async listChannels(): Promise<ConnectorResponse<Array<{ id: string; name: string }>>> {
    await this.delay(150);
    return this.mockResponse([
      { id: 'C001', name: 'general' },
      { id: 'C002', name: 'marketing' },
      { id: 'C003', name: 'engineering' },
    ]);
  }
}

/**
 * Mock Stripe Connector
 */
export class MockStripeConnector extends MockConnector {
  constructor() {
    super('STRIPE');
  }

  async createCustomer(params: {
    email: string;
    name?: string;
  }): Promise<ConnectorResponse<{ id: string; email: string }>> {
    await this.delay(100);
    return this.mockResponse({
      id: `cus_mock_${Date.now()}`,
      email: params.email,
    });
  }

  async createSubscription(params: {
    customerId: string;
    priceId: string;
  }): Promise<ConnectorResponse<{ id: string; status: string }>> {
    await this.delay(150);
    return this.mockResponse({
      id: `sub_mock_${Date.now()}`,
      status: 'active',
    });
  }
}

/**
 * Mock WhatsApp Connector
 */
export class MockWhatsAppConnector extends MockConnector {
  constructor() {
    super('WHATSAPP');
  }

  async sendMessage(params: {
    to: string;
    body: string;
  }): Promise<ConnectorResponse<{ id: string; status: string }>> {
    await this.delay(140);
    return this.mockResponse({
      id: `whatsapp_mock_${Date.now()}`,
      status: 'sent',
    });
  }
}

/**
 * Mock Instagram Connector
 */
export class MockInstagramConnector extends MockConnector {
  constructor() {
    super('INSTAGRAM');
  }

  async postMedia(params: {
    caption: string;
    imageUrl: string;
  }): Promise<ConnectorResponse<{ id: string; permalink: string }>> {
    await this.delay(200);
    return this.mockResponse({
      id: `ig_mock_${Date.now()}`,
      permalink: `https://instagram.com/p/mock_${Date.now()}`,
    });
  }

  async getInsights(): Promise<ConnectorResponse<{ reach: number; impressions: number }>> {
    await this.delay(180);
    return this.mockResponse({
      reach: 1500,
      impressions: 2300,
    });
  }
}

/**
 * Mock Facebook Connector
 */
export class MockFacebookConnector extends MockConnector {
  constructor() {
    super('FACEBOOK');
  }

  async createPost(params: {
    message: string;
    link?: string;
  }): Promise<ConnectorResponse<{ id: string; created_time: string }>> {
    await this.delay(160);
    return this.mockResponse({
      id: `fb_mock_${Date.now()}`,
      created_time: new Date().toISOString(),
    });
  }

  async getPageInsights(): Promise<ConnectorResponse<{ page_views: number; page_engaged_users: number }>> {
    await this.delay(200);
    return this.mockResponse({
      page_views: 5600,
      page_engaged_users: 1200,
    });
  }
}

/**
 * Mock LinkedIn Connector
 */
export class MockLinkedInConnector extends MockConnector {
  constructor() {
    super('LINKEDIN');
  }

  async sharePost(params: {
    text: string;
    visibility: string;
  }): Promise<ConnectorResponse<{ id: string; activity: string }>> {
    await this.delay(170);
    return this.mockResponse({
      id: `linkedin_mock_${Date.now()}`,
      activity: `urn:li:share:${Date.now()}`,
    });
  }

  async getAnalytics(): Promise<ConnectorResponse<{ impressions: number; clicks: number }>> {
    await this.delay(180);
    return this.mockResponse({
      impressions: 3400,
      clicks: 210,
    });
  }
}

/**
 * Mock Twitter/X Connector
 */
export class MockXConnector extends MockConnector {
  constructor() {
    super('X');
  }

  async createTweet(params: {
    text: string;
  }): Promise<ConnectorResponse<{ id: string; text: string }>> {
    await this.delay(130);
    return this.mockResponse({
      id: `x_mock_${Date.now()}`,
      text: params.text,
    });
  }

  async getTweetMetrics(tweetId: string): Promise<ConnectorResponse<{ impressions: number; engagements: number }>> {
    await this.delay(100);
    return this.mockResponse({
      impressions: 4500,
      engagements: 320,
    });
  }
}

/**
 * Mock Google Ads Connector
 */
export class MockGoogleAdsConnector extends MockConnector {
  constructor() {
    super('GOOGLE_ADS');
  }

  async createCampaign(params: {
    name: string;
    budget: number;
  }): Promise<ConnectorResponse<{ id: string; status: string }>> {
    await this.delay(200);
    return this.mockResponse({
      id: `campaign_mock_${Date.now()}`,
      status: 'ENABLED',
    });
  }

  async getCampaignMetrics(campaignId: string): Promise<ConnectorResponse<{
    impressions: number;
    clicks: number;
    cost: number;
  }>> {
    await this.delay(180);
    return this.mockResponse({
      impressions: 15000,
      clicks: 450,
      cost: 1250.50,
    });
  }
}

/**
 * Mock Google Analytics 4 Connector
 */
export class MockGA4Connector extends MockConnector {
  constructor() {
    super('GOOGLE_ANALYTICS');
  }

  async runReport(params: {
    dateRanges: Array<{ startDate: string; endDate: string }>;
    metrics: Array<{ name: string }>;
  }): Promise<ConnectorResponse<{ rows: Array<{ metricValues: Array<{ value: string }> }> }>> {
    await this.delay(250);
    return this.mockResponse({
      rows: [
        { metricValues: [{ value: '12450' }] },
        { metricValues: [{ value: '8920' }] },
      ],
    });
  }
}

/**
 * Mock Google Search Console Connector
 */
export class MockGSCConnector extends MockConnector {
  constructor() {
    super('GOOGLE_SEARCH_CONSOLE');
  }

  async querySearchAnalytics(params: {
    startDate: string;
    endDate: string;
    dimensions: string[];
  }): Promise<ConnectorResponse<{ rows: Array<{ keys: string[]; clicks: number; impressions: number }> }>> {
    await this.delay(200);
    return this.mockResponse({
      rows: [
        { keys: ['keyword1'], clicks: 150, impressions: 3400 },
        { keys: ['keyword2'], clicks: 89, impressions: 2100 },
      ],
    });
  }
}

/**
 * Mock Shopify Connector
 */
export class MockShopifyConnector extends MockConnector {
  constructor() {
    super('SHOPIFY');
  }

  async getProducts(): Promise<ConnectorResponse<Array<{ id: string; title: string; price: string }>>> {
    await this.delay(180);
    return this.mockResponse([
      { id: 'prod_1', title: 'Test Product 1', price: '29.99' },
      { id: 'prod_2', title: 'Test Product 2', price: '49.99' },
    ]);
  }

  async getOrders(): Promise<ConnectorResponse<Array<{ id: string; total_price: string; customer_email: string }>>> {
    await this.delay(200);
    return this.mockResponse([
      { id: 'order_1', total_price: '79.97', customer_email: 'customer1@example.com' },
      { id: 'order_2', total_price: '149.99', customer_email: 'customer2@example.com' },
    ]);
  }
}

/**
 * Mock Discord Connector
 */
export class MockDiscordConnector extends MockConnector {
  constructor() {
    super('DISCORD');
  }

  async sendMessage(params: {
    channelId: string;
    content: string;
  }): Promise<ConnectorResponse<{ id: string; channel_id: string }>> {
    await this.delay(110);
    return this.mockResponse({
      id: `discord_mock_${Date.now()}`,
      channel_id: params.channelId,
    });
  }
}

/**
 * Mock Reddit Connector
 */
export class MockRedditConnector extends MockConnector {
  constructor() {
    super('REDDIT');
  }

  async submitPost(params: {
    subreddit: string;
    title: string;
    text: string;
  }): Promise<ConnectorResponse<{ id: string; url: string }>> {
    await this.delay(190);
    return this.mockResponse({
      id: `reddit_mock_${Date.now()}`,
      url: `https://reddit.com/r/${params.subreddit}/comments/mock`,
    });
  }
}

/**
 * Mock TikTok Connector
 */
export class MockTikTokConnector extends MockConnector {
  constructor() {
    super('TIKTOK');
  }

  async uploadVideo(params: {
    videoUrl: string;
    caption: string;
  }): Promise<ConnectorResponse<{ video_id: string; share_url: string }>> {
    await this.delay(300);
    return this.mockResponse({
      video_id: `tiktok_mock_${Date.now()}`,
      share_url: `https://tiktok.com/@user/video/mock_${Date.now()}`,
    });
  }
}

/**
 * Mock YouTube Connector
 */
export class MockYouTubeConnector extends MockConnector {
  constructor() {
    super('YOUTUBE');
  }

  async uploadVideo(params: {
    title: string;
    description: string;
    videoFile: string;
  }): Promise<ConnectorResponse<{ id: string; url: string }>> {
    await this.delay(400);
    return this.mockResponse({
      id: `youtube_mock_${Date.now()}`,
      url: `https://youtube.com/watch?v=mock_${Date.now()}`,
    });
  }

  async getVideoAnalytics(videoId: string): Promise<ConnectorResponse<{ views: number; likes: number }>> {
    await this.delay(150);
    return this.mockResponse({
      views: 8500,
      likes: 340,
    });
  }
}
