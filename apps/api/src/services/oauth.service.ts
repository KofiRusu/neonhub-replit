/**
 * OAuth Service
 * Handles token refresh and credential management
 */

import { google } from 'googleapis';
import axios from 'axios';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

/**
 * Get valid OAuth tokens for a connector
 * Automatically refreshes if expired
 */
export async function getConnectorTokens(
  userId: string,
  connectorKind: string
): Promise<OAuthTokens | null> {
  const auth = await prisma.connectorAuth.findUnique({
    where: {
      userId_connectorKind: {
        userId,
        connectorKind,
      },
    },
  });

  if (!auth) {
    logger.warn({ userId, connectorKind }, 'No OAuth credentials found');
    return null;
  }

  // Check if token is expired
  const now = new Date();
  const isExpired = auth.expiresAt && auth.expiresAt < now;

  if (!isExpired) {
    return {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken || undefined,
      expiresAt: auth.expiresAt || undefined,
      scopes: auth.scopes as string[],
    };
  }

  // Token expired - refresh if possible
  if (!auth.refreshToken) {
    logger.error({ userId, connectorKind }, 'Token expired and no refresh token available');
    return null;
  }

  // Refresh token based on provider
  try {
    const newTokens = await refreshOAuthTokens(connectorKind, auth.refreshToken);

    // Update stored credentials
    await prisma.connectorAuth.update({
      where: { id: auth.id },
      data: {
        accessToken: newTokens.accessToken,
        expiresAt: newTokens.expiresAt,
        updatedAt: new Date(),
      },
    });

    logger.info({ userId, connectorKind }, 'OAuth token refreshed');

    return newTokens;
  } catch (error) {
    logger.error({ error, userId, connectorKind }, 'Token refresh failed');
    return null;
  }
}

/**
 * Refresh OAuth tokens based on provider
 */
async function refreshOAuthTokens(
  connectorKind: string,
  refreshToken: string
): Promise<OAuthTokens> {
  switch (connectorKind) {
    case 'GOOGLE_ANALYTICS':
    case 'GOOGLE_SEARCH_CONSOLE':
      return refreshGoogleTokens(refreshToken);

    case 'LINKEDIN':
      // LinkedIn doesn't support refresh tokens by default
      throw new Error('LinkedIn does not provide refresh tokens - user must re-authenticate');

    default:
      throw new Error(`Token refresh not implemented for ${connectorKind}`);
  }
}

/**
 * Refresh Google OAuth tokens
 */
async function refreshGoogleTokens(refreshToken: string): Promise<OAuthTokens> {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    refreshToken: credentials.refresh_token || refreshToken,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
    scopes: credentials.scope?.split(' ') || [],
  };
}

/**
 * Revoke OAuth access for a connector
 */
export async function revokeConnectorAccess(
  userId: string,
  connectorKind: string
): Promise<void> {
  const auth = await prisma.connectorAuth.findUnique({
    where: {
      userId_connectorKind: {
        userId,
        connectorKind,
      },
    },
  });

  if (!auth) {
    return; // Already revoked
  }

  // TODO: Call provider's revoke endpoint if available

  await prisma.connectorAuth.delete({
    where: { id: auth.id },
  });

  logger.info({ userId, connectorKind }, 'OAuth access revoked');
}

/**
 * Check if user has valid OAuth credentials for a connector
 */
export async function hasValidOAuth(
  userId: string,
  connectorKind: string
): Promise<boolean> {
  const tokens = await getConnectorTokens(userId, connectorKind);
  return tokens !== null;
}

