import type { ConnectorService } from "../base/ConnectorService.js";
import { logger } from "../../lib/logger.js";

export class TwilioMockConnector implements ConnectorService {
  async sendSms(params: {
    to: string;
    from: string;
    body: string;
  }): Promise<{
    sid: string;
    status: string;
    dateCreated: string;
    dateSent?: string;
  }> {
    logger.debug({ params }, "[MOCK] Twilio sendSms called");
    
    const now = new Date().toISOString();
    
    return {
      sid: `SM-mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "sent",
      dateCreated: now,
      dateSent: now,
    };
  }

  async getSmsStatus(sid: string): Promise<{
    sid: string;
    status: string;
    to: string;
    from: string;
    body: string;
  }> {
    logger.debug({ sid }, "[MOCK] Twilio getSmsStatus called");
    
    return {
      sid,
      status: "delivered",
      to: "+15555555555",
      from: "+15555551234",
      body: "Mock SMS message",
    };
  }

  async listMessages(params?: {
    to?: string;
    from?: string;
    dateSentAfter?: Date;
    pageSize?: number;
  }): Promise<{
    messages: Array<{
      sid: string;
      to: string;
      from: string;
      body: string;
      status: string;
      dateCreated: string;
    }>;
  }> {
    logger.debug({ params }, "[MOCK] Twilio listMessages called");
    
    const count = params?.pageSize || 20;
    const messages = Array.from({ length: count }, (_, i) => ({
      sid: `SM-mock-${i}`,
      to: params?.to || "+15555555555",
      from: params?.from || "+15555551234",
      body: `Mock SMS message ${i}`,
      status: "delivered",
      dateCreated: new Date(Date.now() - i * 60000).toISOString(),
    }));
    
    return { messages };
  }

  async validatePhoneNumber(phoneNumber: string): Promise<{
    phoneNumber: string;
    valid: boolean;
    countryCode: string;
    nationalFormat: string;
  }> {
    logger.debug({ phoneNumber }, "[MOCK] Twilio validatePhoneNumber called");
    
    // Simple validation mock
    const valid = /^\+\d{10,15}$/.test(phoneNumber);
    
    return {
      phoneNumber,
      valid,
      countryCode: "US",
      nationalFormat: phoneNumber.replace("+1", ""),
    };
  }
}
