import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { GmailMockConnector } from "./services/gmail-mock.js";
import { SlackMockConnector } from "./services/slack-mock.js";
import { TwilioMockConnector } from "./services/twilio-mock.js";
import { recordToolExecution } from "../services/tool-execution.service.js";

// Real connector imports (when implemented)
// import { GmailConnector } from "./services/gmail.js";
// import { SlackConnector } from "./services/slack.js";
// import { TwilioConnector } from "./services/twilio.js";

export type ConnectorType = "gmail" | "slack" | "twilio" | "stripe" | "shopify";

const USE_MOCK_CONNECTORS = process.env.USE_MOCK_CONNECTORS === "true" || env.NODE_ENV === "test";

if (USE_MOCK_CONNECTORS) {
  logger.info("🎭 Connector mock mode ENABLED (USE_MOCK_CONNECTORS=true or NODE_ENV=test)");
} else {
  logger.info("🔌 Connector real mode ENABLED (production connectors)");
}

export class ConnectorFactory {
  /**
   * Create a connector instance based on type and mode (mock vs real)
   */
  static create(
    type: ConnectorType,
    credentials?: { accessToken?: string; apiKey?: string; [key: string]: any }
  ): any {
    const connector = USE_MOCK_CONNECTORS ? this.createMock(type) : this.createReal(type, credentials);
    return attachToolTelemetry(connector, type);
  }

  /**
   * Create a mock connector (no network calls, deterministic responses)
   */
  private static createMock(type: ConnectorType): any {
    logger.debug({ type }, "Creating mock connector");
    
    switch (type) {
      case "gmail":
        return new GmailMockConnector();
      
      case "slack":
        return new SlackMockConnector();
      
      case "twilio":
        return new TwilioMockConnector();
      
      case "stripe":
      case "shopify":
        // Fallback mock for not-yet-implemented connectors
        return new GenericMockConnector(type);
      
      default:
        throw new Error(`Unknown connector type: ${type}`);
    }
  }

  /**
   * Create a real connector (makes actual network calls)
   */
  private static createReal(
    type: ConnectorType,
    credentials?: { accessToken?: string; apiKey?: string; [key: string]: any }
  ): any {
    logger.debug({ type }, "Creating real connector");
    
    // TODO: Implement real connectors when USE_MOCK_CONNECTORS=false
    // For now, throw error or return mock in production
    
    if (!credentials) {
      throw new Error(`Credentials required for real ${type} connector`);
    }
    
    switch (type) {
      case "gmail":
        // return new GmailConnector(credentials);
        throw new Error("Real Gmail connector not yet implemented - use mock mode");
      
      case "slack":
        // return new SlackConnector(credentials);
        throw new Error("Real Slack connector not yet implemented - use mock mode");
      
      case "twilio":
        // return new TwilioConnector(credentials);
        throw new Error("Real Twilio connector not yet implemented - use mock mode");
      
      case "stripe":
      case "shopify":
        throw new Error(`Real ${type} connector not yet implemented - use mock mode`);
      
      default:
        throw new Error(`Unknown connector type: ${type}`);
    }
  }

  /**
   * Check if mock mode is enabled
   */
  static isMockMode(): boolean {
    return USE_MOCK_CONNECTORS;
  }
}

/**
 * Generic mock connector for connectors not yet implemented
 */
class GenericMockConnector {
  constructor(private type: ConnectorType) {}

  async execute(method: string, params: any): Promise<any> {
    logger.debug({ type: this.type, method, params }, "[MOCK] Generic connector called");
    
    return {
      success: true,
      mockResponse: true,
      type: this.type,
      method,
      timestamp: new Date().toISOString(),
    };
  }
}

function attachToolTelemetry<T extends object>(connector: T, type: ConnectorType): T {
  if (!connector || typeof connector !== "object") {
    return connector;
  }

  const wrapped = new Map<PropertyKey, (...args: unknown[]) => Promise<unknown>>();

  return new Proxy(connector, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function" || prop === "constructor") {
        return value;
      }

      if (wrapped.has(prop)) {
        return wrapped.get(prop);
      }

      const instrumented = async (...args: unknown[]) => {
        const payload = args.length <= 1 ? args[0] : args;
        return recordToolExecution(type, String(prop), payload, () =>
          Promise.resolve(value.apply(target, args)),
        );
      };

      wrapped.set(prop, instrumented);
      return instrumented;
    },
  });
}
