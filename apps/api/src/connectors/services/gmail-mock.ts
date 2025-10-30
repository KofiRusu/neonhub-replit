import type { ConnectorService } from "../base/ConnectorService.js";
import { logger } from "../../lib/logger.js";

export class GmailMockConnector implements ConnectorService {
  async send(params: {
    to: string;
    subject: string;
    body: string;
    from?: string;
  }): Promise<{ id: string; success: boolean }> {
    logger.debug({ params }, "[MOCK] Gmail send called");
    
    // Deterministic mock: simulate successful send
    const mockId = `mock-gmail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: mockId,
      success: true,
    };
  }

  async getProfile(): Promise<{ email: string; name: string }> {
    logger.debug("[MOCK] Gmail getProfile called");
    
    return {
      email: "mock-user@example.com",
      name: "Mock User",
    };
  }

  async listMessages(params?: {
    maxResults?: number;
    pageToken?: string;
  }): Promise<{
    messages: Array<{ id: string; threadId: string }>;
    nextPageToken?: string;
  }> {
    logger.debug({ params }, "[MOCK] Gmail listMessages called");
    
    const count = params?.maxResults || 10;
    const messages = Array.from({ length: count }, (_, i) => ({
      id: `mock-msg-${i}`,
      threadId: `mock-thread-${Math.floor(i / 3)}`,
    }));
    
    return {
      messages,
      nextPageToken: params?.pageToken ? undefined : "mock-next-page-token",
    };
  }

  async getMessage(id: string): Promise<{
    id: string;
    threadId: string;
    subject: string;
    from: string;
    body: string;
  }> {
    logger.debug({ id }, "[MOCK] Gmail getMessage called");
    
    return {
      id,
      threadId: `mock-thread-${id}`,
      subject: "Mock Email Subject",
      from: "sender@example.com",
      body: "This is a mock email body for testing purposes.",
    };
  }
}
