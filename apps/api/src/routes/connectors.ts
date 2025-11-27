import { Router } from "express";
import { z } from "zod";
import { ConnectorKind } from "@prisma/client";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { ok, fail } from "../lib/http.js";
import { connectorRegistry, registerConnectors } from "../connectors/index.js";
import { connectorCredentialManager } from "../connectors/auth/CredentialManager.js";
import { actionHandler } from "../connectors/execution/ActionHandler.js";
import { triggerHandler } from "../connectors/execution/TriggerHandler.js";
import { OAuth2Provider } from "../connectors/auth/OAuth2Provider.js";
import {
  listConnectors,
  listConnectorAuths,
  syncRegisteredConnectors,
} from "../services/connector.service.js";

export const connectorsRouter: Router = Router();

const apiKeySchema = z.object({
  apiKey: z.string().min(1).optional(),
  apiSecret: z.string().min(1).optional(),
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const actionRequestSchema = z.object({
  input: z.unknown(),
  accountId: z.string().optional(),
});

const triggerRequestSchema = z.object({
  settings: z.unknown().optional(),
  cursor: z.string().optional().nullable(),
  accountId: z.string().optional(),
});

const oauthCallbackSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

interface OAuthEnvConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}

const oauthEnvMap: Record<string, OAuthEnvConfig> = {
  slack: {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    redirectUri: process.env.SLACK_REDIRECT_URI,
  },
  gmail: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  google_sheets: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  notion: {
    clientId: process.env.NOTION_CLIENT_ID,
    clientSecret: process.env.NOTION_CLIENT_SECRET,
    redirectUri: process.env.NOTION_REDIRECT_URI,
  },
  asana: {
    clientId: process.env.ASANA_CLIENT_ID,
    clientSecret: process.env.ASANA_CLIENT_SECRET,
    redirectUri: process.env.ASANA_REDIRECT_URI,
  },
  hubspot: {
    clientId: process.env.HUBSPOT_CLIENT_ID,
    clientSecret: process.env.HUBSPOT_CLIENT_SECRET,
    redirectUri: process.env.HUBSPOT_REDIRECT_URI,
  },
};

function requireOAuthConfig(name: string, authConfig: any) {
  const envConfig = oauthEnvMap[name];
  if (!envConfig || !envConfig.clientId || !envConfig.clientSecret || !envConfig.redirectUri) {
    throw new Error(`OAuth configuration missing for ${name}. Check environment variables.`);
  }

  return {
    authorizeUrl: authConfig.authorizeUrl,
    tokenUrl: authConfig.tokenUrl,
    scopes: authConfig.scopes ?? [],
    clientId: envConfig.clientId,
    clientSecret: envConfig.clientSecret,
    redirectUri: envConfig.redirectUri,
  };
}

let connectorsInitialised = false;

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

async function ensureConnectorsLoaded() {
  if (connectorsInitialised) return;
  await registerConnectors();
  await syncRegisteredConnectors();
  connectorsInitialised = true;
}

connectorsRouter.get("/", requireAuth, async (_req, res) => {
  try {
    await ensureConnectorsLoaded();
    const connectors = await listConnectors();
    return res.json(ok(connectors));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list connectors";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.get("/auth", requireAuth, async (req: AuthRequest, res) => {
  try {
    const auths = await listConnectorAuths(req.user!.id);
    return res.json(ok(auths));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list connector authorisations";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/oauth/start", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }
    if (connector.metadata.authType !== "oauth2") {
      return res.status(400).json(fail("Connector does not support OAuth2").body);
    }
    const connectorKind = connector.metadata.category as ConnectorKind;

    const oauthConfig = requireOAuthConfig(connector.metadata.name, connector.metadata.authConfig ?? {});
    const provider = new OAuth2Provider(oauthConfig);
    const { url, state } = await provider.getAuthorizationRequest();
    return res.json(ok({ url, state }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start OAuth flow";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/oauth/callback", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }
    if (connector.metadata.authType !== "oauth2") {
      return res.status(400).json(fail("Connector does not support OAuth2").body);
    }
    const connectorKind = connector.metadata.category as ConnectorKind;

    const payload = oauthCallbackSchema.parse(req.body);
    const oauthConfig = requireOAuthConfig(connector.metadata.name, connector.metadata.authConfig ?? {});
    const provider = new OAuth2Provider(oauthConfig);
    const tokens = await provider.exchangeCode(payload.code);

    await connectorCredentialManager.save({
      userId: req.user!.id,
      connectorId: connector.metadata.name,
      connectorKind,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
    });

    return res.json(ok({ connected: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/api-key", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }
    if (connector.metadata.authType === "oauth2") {
      return res.status(400).json(fail("Connector uses OAuth2").body);
    }
    const connectorKind = connector.metadata.category as ConnectorKind;

    const payload = apiKeySchema.parse(req.body);
    if (!payload.apiKey && !payload.accessToken) {
      return res.status(400).json(fail("apiKey or accessToken is required").body);
    }

    await connectorCredentialManager.save({
      userId: req.user!.id,
      connectorId: connector.metadata.name,
      connectorKind,
      apiKey: payload.apiKey,
      apiSecret: payload.apiSecret ?? payload.accessToken ?? null,
      accessToken: payload.accessToken ?? null,
      refreshToken: payload.refreshToken ?? null,
      accountId: payload.accountId ?? null,
      accountName: payload.accountName ?? null,
      metadata: payload.metadata ?? null,
    });

    return res.json(ok({ connected: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to store API credentials";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/test", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }

    const context = await connectorCredentialManager.toContext(req.user!.id, connector.metadata.name, req.body?.accountId);
    if (!context) {
      return res.status(404).json(fail("Connector not authorised").body);
    }

    const success = await connector.testConnection(context);
    return res.json(ok({ success }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to test connector";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.delete("/:name/auth/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    await connectorCredentialManager.remove(req.params.id);
    return res.json(ok({ removed: true }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove connector auth";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/actions/:actionId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }

    const payload = actionRequestSchema.parse(req.body);
    const context = await connectorCredentialManager.toContext(req.user!.id, connector.metadata.name, payload.accountId);
    if (!context) {
      return res.status(404).json(fail("Connector not authorised").body);
    }

    const result = await actionHandler.execute(connector.metadata.name, req.params.actionId, {
      auth: context,
      input: payload.input,
    });

    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute connector action";
    return res.status(500).json(fail(message).body);
  }
});

connectorsRouter.post("/:name/triggers/:triggerId/run", requireAuth, async (req: AuthRequest, res) => {
  try {
    const connector = connectorRegistry.get(req.params.name);
    if (!connector) {
      return res.status(404).json(fail("Connector not found").body);
    }

    const payload = triggerRequestSchema.parse(req.body);
    const context = await connectorCredentialManager.toContext(req.user!.id, connector.metadata.name, payload.accountId);
    if (!context) {
      return res.status(404).json(fail("Connector not authorised").body);
    }

    const triggerSettings = normalizeRecord(payload.settings);

    const result = await triggerHandler.run(connector.metadata.name, req.params.triggerId, {
      auth: context,
      cursor: payload.cursor ?? null,
      settings: triggerSettings ?? {},
    });

    return res.json(ok(result));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run connector trigger";
    return res.status(500).json(fail(message).body);
  }
});

export default connectorsRouter;
