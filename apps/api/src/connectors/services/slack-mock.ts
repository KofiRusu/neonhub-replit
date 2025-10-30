import type { ConnectorService } from "../base/ConnectorService.js";
import { logger } from "../../lib/logger.js";

export class SlackMockConnector implements ConnectorService {
  async postMessage(params: {
    channel: string;
    text: string;
    blocks?: any[];
  }): Promise<{ ts: string; channel: string; success: boolean }> {
    logger.debug({ params }, "[MOCK] Slack postMessage called");
    
    return {
      ts: `${Date.now()}.000000`,
      channel: params.channel,
      success: true,
    };
  }

  async listChannels(): Promise<{
    channels: Array<{ id: string; name: string; isMember: boolean }>;
  }> {
    logger.debug("[MOCK] Slack listChannels called");
    
    return {
      channels: [
        { id: "C123", name: "general", isMember: true },
        { id: "C456", name: "random", isMember: true },
        { id: "C789", name: "engineering", isMember: false },
      ],
    };
  }

  async getUserInfo(userId: string): Promise<{
    id: string;
    name: string;
    realName: string;
    email: string;
  }> {
    logger.debug({ userId }, "[MOCK] Slack getUserInfo called");
    
    return {
      id: userId,
      name: "mockuser",
      realName: "Mock User",
      email: "mockuser@example.com",
    };
  }

  async uploadFile(params: {
    channels: string;
    file: Buffer;
    filename: string;
    title?: string;
  }): Promise<{ file: { id: string; url: string }; success: boolean }> {
    logger.debug({ params: { ...params, file: "[Buffer]" } }, "[MOCK] Slack uploadFile called");
    
    return {
      file: {
        id: `F-mock-${Date.now()}`,
        url: `https://files.slack.com/mock/${params.filename}`,
      },
      success: true,
    };
  }
}
