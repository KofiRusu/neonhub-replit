/**
 * OAuth Routes - Third-Party Service Authentication
 * Implements OAuth 2.0 flows for Google Analytics, LinkedIn, Instagram, GSC
 */

import { Router } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

export const oauthRouter: Router = Router();

// OAuth state storage (in production, use Redis)
const oauthStates = new Map<string, { userId: string; provider: string; expiresAt: number }>();

// Helper to generate secure random state
function generateState(): string {
  return `state_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Helper to save connector credentials
async function saveConnectorCredentials(
  userId: string,
  organizationId: string,
  connectorKind: string,
  credentials: any
): Promise<void> {
  await prisma.connectorAuth.upsert({
    where: {
      userId_connectorKind: {
        userId,
        connectorKind,
      },
    },
    create: {
      userId,
      organizationId,
      connectorKind,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || null,
      expiresAt: credentials.expires_in
        ? new Date(Date.now() + credentials.expires_in * 1000)
        : null,
      scopes: credentials.scope?.split(' ') || [],
      metadata: credentials.metadata || {},
    },
    update: {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || null,
      expiresAt: credentials.expires_in
        ? new Date(Date.now() + credentials.expires_in * 1000)
        : null,
      scopes: credentials.scope?.split(' ') || [],
      metadata: credentials.metadata || {},
      updatedAt: new Date(),
    },
  });

  logger.info({ userId, connectorKind }, 'OAuth credentials saved');
}

//
// Google Analytics 4 (GA4) + Google Search Console (GSC)
//

oauthRouter.get('/google/start', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const organizationId = req.query.organizationId as string;

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId required' });
    }

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    const state = generateState();
    oauthStates.set(state, {
      userId,
      provider: 'google',
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    // Request both GA4 and GSC scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state,
      prompt: 'consent', // Force consent to get refresh token
    });

    res.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'Google OAuth start failed');
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
});

oauthRouter.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state as string);
    if (!stateData || stateData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state as string);

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    // Get user's organizations (or use from state)
    const organizationId = req.query.organizationId as string || 'default-org-id';

    // Save GA4 credentials
    await saveConnectorCredentials(
      stateData.userId,
      organizationId,
      'GOOGLE_ANALYTICS',
      {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
        scope: tokens.scope,
        metadata: {
          token_type: tokens.token_type,
        },
      }
    );

    // Also save GSC credentials (same tokens, different connector)
    await saveConnectorCredentials(
      stateData.userId,
      organizationId,
      'GOOGLE_SEARCH_CONSOLE',
      {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date ? (tokens.expiry_date - Date.now()) / 1000 : 3600,
        scope: tokens.scope,
        metadata: {
          token_type: tokens.token_type,
        },
      }
    );

    logger.info({ userId: stateData.userId }, 'Google OAuth complete - GA4 + GSC credentials saved');

    // Redirect to success page
    res.redirect('/oauth/success?provider=google&connectors=ga4,gsc');
  } catch (error) {
    logger.error({ error }, 'Google OAuth callback failed');
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

//
// LinkedIn OAuth
//

oauthRouter.get('/linkedin/start', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const organizationId = req.query.organizationId as string;

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId required' });
    }

    const state = generateState();
    oauthStates.set(state, {
      userId,
      provider: 'linkedin',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(env.LINKEDIN_CLIENT_ID!)}&` +
      `redirect_uri=${encodeURIComponent(env.LINKEDIN_REDIRECT_URI!)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=${encodeURIComponent('r_liteprofile r_emailaddress w_member_social r_organization_social rw_organization_admin')}`;

    res.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'LinkedIn OAuth start failed');
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
});

oauthRouter.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state as string);
    if (!stateData || stateData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state as string);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: env.LINKEDIN_REDIRECT_URI!,
        client_id: env.LINKEDIN_CLIENT_ID!,
        client_secret: env.LINKEDIN_CLIENT_SECRET!,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    const organizationId = req.query.organizationId as string || 'default-org-id';

    await saveConnectorCredentials(
      stateData.userId,
      organizationId,
      'LINKEDIN',
      {
        access_token,
        refresh_token: null, // LinkedIn doesn't provide refresh tokens by default
        expires_in,
        scope: tokenResponse.data.scope,
      }
    );

    logger.info({ userId: stateData.userId }, 'LinkedIn OAuth complete');

    res.redirect('/oauth/success?provider=linkedin');
  } catch (error) {
    logger.error({ error }, 'LinkedIn OAuth callback failed');
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

//
// Instagram (Meta Graph API) - Full Implementation
//

oauthRouter.get('/instagram/start', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const organizationId = req.query.organizationId as string;

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId required' });
    }

    if (!env.META_APP_ID || !env.META_APP_SECRET) {
      logger.warn('Meta OAuth credentials not configured - using mock connector');
      return res.redirect('/oauth/skeleton?provider=instagram&message=Configure+META_APP_ID+and+META_APP_SECRET');
    }

    const state = generateState();
    oauthStates.set(state, {
      userId,
      provider: 'instagram',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const redirectUri = `${env.API_URL || 'http://localhost:4100'}/api/oauth/instagram/callback`;
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${encodeURIComponent(env.META_APP_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=${encodeURIComponent('instagram_basic,instagram_content_publish,pages_show_list')}&` +
      `response_type=code`;

    res.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'Instagram OAuth start failed');
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
});

oauthRouter.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state as string);
    if (!stateData || stateData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state as string);

    const redirectUri = `${env.API_URL || 'http://localhost:4100'}/api/oauth/instagram/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: env.META_APP_ID,
          client_secret: env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code: code as string,
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    const organizationId = req.query.organizationId as string || 'default-org-id';

    // Save Instagram credentials
    await saveConnectorCredentials(
      stateData.userId,
      organizationId,
      'INSTAGRAM',
      {
        access_token,
        refresh_token: null, // Meta short-lived tokens
        expires_in: expires_in || 3600,
        scope: 'instagram_basic,instagram_content_publish',
        metadata: {
          provider: 'meta',
          token_type: 'short-lived',
        },
      }
    );

    logger.info({ userId: stateData.userId }, 'Instagram OAuth complete');

    res.redirect('/oauth/success?provider=instagram');
  } catch (error) {
    logger.error({ error }, 'Instagram OAuth callback failed');
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

//
// Facebook Pages - Full Implementation
//

oauthRouter.get('/facebook/start', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const organizationId = req.query.organizationId as string;

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId required' });
    }

    if (!env.META_APP_ID || !env.META_APP_SECRET) {
      logger.warn('Meta OAuth credentials not configured - using mock connector');
      return res.redirect('/oauth/skeleton?provider=facebook&message=Configure+META_APP_ID+and+META_APP_SECRET');
    }

    const state = generateState();
    oauthStates.set(state, {
      userId,
      provider: 'facebook',
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const redirectUri = `${env.API_URL || 'http://localhost:4100'}/api/oauth/facebook/callback`;

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${encodeURIComponent(env.META_APP_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${encodeURIComponent(state)}&` +
      `scope=${encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata')}&` +
      `response_type=code`;

    res.redirect(authUrl);
  } catch (error) {
    logger.error({ error }, 'Facebook OAuth start failed');
    res.status(500).json({ error: 'OAuth initialization failed' });
  }
});

oauthRouter.get('/facebook/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauthStates.get(state as string);
    if (!stateData || stateData.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    oauthStates.delete(state as string);

    const redirectUri = `${env.API_URL || 'http://localhost:4100'}/api/oauth/facebook/callback`;

    // Exchange code for access token
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v18.0/oauth/access_token`,
      {
        params: {
          client_id: env.META_APP_ID,
          client_secret: env.META_APP_SECRET,
          redirect_uri: redirectUri,
          code: code as string,
        },
      }
    );

    const { access_token, expires_in } = tokenResponse.data;

    const organizationId = req.query.organizationId as string || 'default-org-id';

    // Save Facebook credentials
    await saveConnectorCredentials(
      stateData.userId,
      organizationId,
      'FACEBOOK',
      {
        access_token,
        refresh_token: null, // Meta short-lived tokens
        expires_in: expires_in || 3600,
        scope: 'pages_show_list,pages_manage_posts',
        metadata: {
          provider: 'meta',
          token_type: 'short-lived',
        },
      }
    );

    logger.info({ userId: stateData.userId }, 'Facebook OAuth complete');

    res.redirect('/oauth/success?provider=facebook');
  } catch (error) {
    logger.error({ error }, 'Facebook OAuth callback failed');
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

//
// Google Search Console (GSC) - Uses Google OAuth (same as GA4)
//

oauthRouter.get('/gsc/start', async (req, res) => {
  // Redirect to Google OAuth (includes GSC scopes)
  res.redirect(`/api/oauth/google/start?${new URLSearchParams(req.query as any).toString()}`);
});

oauthRouter.get('/gsc/callback', async (req, res) => {
  // Handled by Google OAuth callback
  res.redirect(`/api/oauth/google/callback?${new URLSearchParams(req.query as any).toString()}`);
});

//
// OAuth Success Page
//

oauthRouter.get('/success', (req, res) => {
  const { provider, connectors } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Success</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 100px auto;
          padding: 20px;
          text-align: center;
        }
        .success { color: #10b981; font-size: 48px; }
        h1 { color: #1f2937; }
        p { color: #6b7280; }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="success">✅</div>
      <h1>OAuth Connected</h1>
      <p>Successfully connected <strong>${provider}</strong>${connectors ? ` (${connectors})` : ''}</p>
      <p>Your credentials have been securely saved.</p>
      <a href="/dashboard/settings/integrations" class="btn">Return to Dashboard</a>
    </body>
    </html>
  `);
});

oauthRouter.get('/skeleton', (req, res) => {
  const { provider, message } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth Not Yet Implemented</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 600px;
          margin: 100px auto;
          padding: 20px;
          text-align: center;
        }
        .warn { color: #f59e0b; font-size: 48px; }
        h1 { color: #1f2937; }
        p { color: #6b7280; }
        code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="warn">⚠️</div>
      <h1>OAuth Skeleton</h1>
      <p><strong>${provider}</strong> OAuth is not yet fully implemented.</p>
      <p>${message || 'Use mock connectors for testing: USE_MOCK_CONNECTORS=true'}</p>
      <p><code>Planned for Week 2 completion</code></p>
    </body>
    </html>
  `);
});

export default oauthRouter;
