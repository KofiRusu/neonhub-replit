import { z } from "zod";
import pRetry from "p-retry";

export type RateLimitPolicy = {
  max: number;
  windowMs: number;
};

export interface ConnectorActionContext {
  workspaceId: string;
  runId: string;
  stepId: string;
  logger: (message: string, meta?: Record<string, unknown>) => void;
  credential?: {
    kind: "oauth2" | "apiKey" | "basic";
    value: Record<string, unknown>;
  } | null;
}

export interface ConnectorActionDefinition<TInput extends Record<string, unknown>, TResult> {
  schema: z.ZodType<TInput>;
  handler: (ctx: ConnectorActionContext, input: TInput) => Promise<TResult>;
}

export interface ConnectorDefinition {
  key: string;
  name: string;
  auth: {
    kind: "oauth2" | "apiKey" | "basic" | "none";
  };
  rateLimit?: RateLimitPolicy;
  actions: Record<string, ConnectorActionDefinition<any, any>>;
}

export class ConnectorRegistry {
  private readonly connectors = new Map<string, ConnectorDefinition>();

  register(definition: ConnectorDefinition): void {
    if (this.connectors.has(definition.key)) {
      throw new Error(`Connector already registered: ${definition.key}`);
    }
    this.connectors.set(definition.key, definition);
  }

  get(key: string): ConnectorDefinition | undefined {
    return this.connectors.get(key);
  }

  list(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }
}

export const connectorRegistry = new ConnectorRegistry();

export function createConnector(definition: ConnectorDefinition): ConnectorDefinition {
  connectorRegistry.register(definition);
  return definition;
}

export function redactSecrets(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 10 ? `${value.slice(0, 4)}…redacted` : "***";
  }
  if (Array.isArray(value)) {
    return value.map(item => redactSecrets(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => {
        if (/token|secret|key|password/i.test(key)) {
          return [key, "***redacted***"];
        }
        return [key, redactSecrets(entry)];
      })
    );
  }
  return value;
}

export async function executeConnectorAction(
  connectorKey: string,
  actionKey: string,
  ctx: ConnectorActionContext,
  payload: unknown
): Promise<unknown> {
  const connector = connectorRegistry.get(connectorKey);
  if (!connector) {
    throw new Error(`Connector not found: ${connectorKey}`);
  }
  const action = connector.actions[actionKey];
  if (!action) {
    throw new Error(`Action ${actionKey} not found on connector ${connectorKey}`);
  }

  const validated = action.schema.parse(payload);

  const run = async () => action.handler(ctx, validated);

  if (!connector.rateLimit) {
    return run();
  }

  return pRetry(run, {
    retries: 3,
    onFailedAttempt(error) {
      ctx.logger("connector_action_retry", {
        action: actionKey,
        connector: connectorKey,
        attemptNumber: error.attemptNumber,
        retriesLeft: error.retriesLeft,
        error: (error as Error).message
      });
    }
  });
}

const httpActionSchema = z.object({
  url: z.string().url(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
  headers: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  body: z.any().optional()
});

type HttpActionInput = z.infer<typeof httpActionSchema>;

createConnector({
  key: "http",
  name: "Generic HTTP",
  auth: { kind: "none" },
  rateLimit: { max: 60, windowMs: 60_000 },
  actions: {
    get: {
      schema: httpActionSchema,
      async handler(ctx, input: HttpActionInput) {
        const url = new URL(input.url);
        if (input.query) {
          for (const [key, value] of Object.entries(input.query)) {
            url.searchParams.set(key, String(value));
          }
        }

        ctx.logger("http_request", {
          method: input.method,
          url: url.toString()
        });

        const response = await fetch(url, {
          method: input.method,
          headers: input.headers,
          body: input.body ? JSON.stringify(input.body) : undefined
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (!response.ok) {
          const errorPayload = contentType.includes("application/json") ? await response.json() : await response.text();
          throw new Error(`HTTP request failed: ${response.status} ${response.statusText} ${JSON.stringify(redactSecrets(errorPayload))}`);
        }

        if (contentType.includes("application/json")) {
          return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.json()
          };
        }

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.text()
        };
      }
    }
  }
});

const slackActionSchema = z.object({
  webhookUrl: z.string().url(),
  channel: z.string(),
  text: z.string().min(1),
  username: z.string().optional(),
  iconEmoji: z.string().optional()
});

type SlackActionInput = z.infer<typeof slackActionSchema>;

createConnector({
  key: "slack",
  name: "Slack Webhook",
  auth: { kind: "none" },
  rateLimit: { max: 50, windowMs: 60_000 },
  actions: {
    postMessage: {
      schema: slackActionSchema,
      async handler(ctx, input: SlackActionInput) {
        ctx.logger("slack_post_message", {
          channel: input.channel
        });

        const response = await fetch(input.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: input.channel,
            text: input.text,
            username: input.username,
            icon_emoji: input.iconEmoji
          })
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Slack webhook failed: ${response.status} ${response.statusText} ${body}`);
        }

        return { status: "ok" };
      }
    }
  }
});
