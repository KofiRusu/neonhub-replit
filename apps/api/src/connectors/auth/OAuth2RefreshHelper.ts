import { OAuth2Provider } from "./OAuth2Provider.js";
import { connectorCredentialManager } from "./CredentialManager.js";
import type { ConnectorAuthContext } from "../base/types.js";
import type { ConnectorKind } from "@prisma/client";
import { logger } from "../../lib/logger.js";

export interface RefreshableAuthContext {
  userId: string;
  connectorId: string;
  connectorKind: ConnectorKind;
  accountId?: string | null;
  auth: ConnectorAuthContext;
  expiresAt: Date | null;
  oauth2Provider: OAuth2Provider;
}

/**
 * Shared OAuth2 token refresh helper
 * Automatically refreshes expired tokens and updates the credential store
 */
export class OAuth2RefreshHelper {
  /**
   * Ensures the auth context has a valid, non-expired access token
   * Automatically refreshes if needed
   */
  static async ensureValidToken(context: RefreshableAuthContext): Promise<ConnectorAuthContext> {
    const { userId, connectorId, accountId, auth, expiresAt, oauth2Provider } = context;

    // Check if token needs refresh
    if (!oauth2Provider.isTokenExpired(expiresAt)) {
      return auth;
    }

    // Token expired, attempt refresh
    if (!auth.refreshToken) {
      logger.warn(
        { userId, connectorId, accountId },
        "OAuth token expired but no refresh token available - user needs to re-authenticate"
      );
      throw new Error("OAuth token expired and no refresh token available");
    }

    logger.info({ userId, connectorId, accountId }, "Refreshing expired OAuth token");

    try {
      const tokenResponse = await oauth2Provider.refreshToken(auth.refreshToken);

      const newExpiresAt = tokenResponse.expires_in
        ? new Date(Date.now() + tokenResponse.expires_in * 1000)
        : null;

      // Save refreshed credentials
      await connectorCredentialManager.save({
        userId,
        connectorId,
        connectorKind: context.connectorKind,
        accountId,
        accountName: auth.metadata?.accountName as string | undefined,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? auth.refreshToken,
        tokenType: tokenResponse.token_type ?? "Bearer",
        expiresAt: newExpiresAt,
        scope: tokenResponse.scope,
        metadata: auth.metadata ?? {},
      });

      logger.info({ userId, connectorId, accountId }, "OAuth token refreshed successfully");

      return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token ?? auth.refreshToken,
        metadata: auth.metadata,
      };
    } catch (error) {
      logger.error(
        { userId, connectorId, accountId, error },
        "Failed to refresh OAuth token - user needs to re-authenticate"
      );
      throw new Error(`OAuth token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Wraps a connector action to automatically handle token refresh
   */
  static async withAutoRefresh<T>(
    context: RefreshableAuthContext,
    action: (auth: ConnectorAuthContext) => Promise<T>
  ): Promise<T> {
    const validAuth = await this.ensureValidToken(context);
    return action(validAuth);
  }
}

