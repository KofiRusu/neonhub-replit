import { z } from "zod";

export type ConnectorAuthType = "oauth2" | "api_key" | "none";

export interface ConnectorMetadata {
  name: string;
  displayName: string;
  description: string;
  category: string;
  iconUrl?: string;
  websiteUrl?: string;
  authType: ConnectorAuthType;
  authConfig?: Record<string, unknown>;
}

export interface ConnectorAuthContext {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  apiSecret?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectorActionContext<TInput = unknown> {
  auth: ConnectorAuthContext;
  input: TInput;
  settings?: Record<string, unknown>;
}

export interface ConnectorTriggerContext {
  auth: ConnectorAuthContext;
  cursor?: string | null;
  settings?: Record<string, unknown>;
}

export interface ConnectorActionDefinition<TInput = unknown, TResult = unknown> {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  execute(ctx: ConnectorActionContext<TInput>): Promise<TResult>;
}

export interface ConnectorTriggerDefinition<TCursor = string | null, TPayload = unknown> {
  id: string;
  name: string;
  description: string;
  pollingIntervalSeconds?: number;
  inputSchema?: z.ZodType<any>;
  run(ctx: ConnectorTriggerContext): Promise<{
    cursor: TCursor;
    items: TPayload[];
  }>;
}
