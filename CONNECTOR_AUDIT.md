# Connector Audit — 2025-10-27

| ConnectorKind | Runtime Implementation | Mock Asset | Env / Secret Expectations | Status |
| --- | --- | --- | --- | --- |
| EMAIL | `apps/api/src/connectors/services/GmailConnector.ts` (Gmail OAuth) | `apps/api/src/connectors/mocks/email.ts` (fixtures only) | Requires Google OAuth client + tokens (unset) | ⚠️ Implementation assumes live Gmail API; mock not wired into registry/tests. |
| SMS | `apps/api/src/connectors/services/SMSConnector.ts` | `apps/api/src/connectors/mocks/sms.ts` | Twilio Account SID/Auth Token (`apiKey`/`apiSecret`) + default From number metadata | ⚠️ Runs against live Twilio REST API; add sandbox toggle for non-production use. |
| WHATSAPP | `apps/api/src/connectors/services/WhatsAppConnector.ts` | `apps/api/src/connectors/mocks/whatsapp.ts` | Twilio WhatsApp Account SID/Auth Token (`apiKey`/`apiSecret`) + default From number metadata | ⚠️ Uses Twilio production REST endpoints; add sandbox flag before enabling in lower envs. |
| REDDIT | `apps/api/src/connectors/services/RedditConnector.ts` | `apps/api/src/connectors/mocks/reddit.ts` | Reddit script app credentials (clientId/clientSecret via apiKey/apiSecret, username/password via metadata) | ⚠️ Depends on snoowrap (uses password grant); rotate to OAuth refresh tokens before production. |
| INSTAGRAM | `apps/api/src/connectors/services/InstagramConnector.ts` | `apps/api/src/connectors/mocks/instagram.ts` | Meta Graph access token + page ID (via metadata) | ⚠️ Uses direct Graph API calls; ensure tokens have publish/manage_insights scopes. |
| FACEBOOK | `apps/api/src/connectors/services/FacebookConnector.ts` | `apps/api/src/connectors/mocks/facebook.ts` | Page access token + page ID + ad account ID | ⚠️ Calls Graph Marketing API directly; ensure tokens scoped for ads + pages. |
| X (Twitter) | `apps/api/src/connectors/services/TwitterConnector.ts` | `apps/api/src/connectors/mocks/social.ts` | Twitter API key/secret | ⚠️ Uses live REST calls; no toggle for mock mode. |
| YOUTUBE | `apps/api/src/connectors/services/YouTubeConnector.ts` | `apps/api/src/connectors/mocks/youtube.ts` | Google OAuth client & refresh token (channel access) | ⚠️ Uses resumable upload via googleapis; ensure service account has youtube scopes. |
| TIKTOK | `apps/api/src/connectors/services/TikTokConnector.ts` | `apps/api/src/connectors/mocks/tiktok.ts` | TikTok Business access token (`accessToken`) + advertiserId metadata | ⚠️ Uses live Business API endpoints; consider sandbox flag + fixtures before production use. |
| GOOGLE_ADS | `apps/api/src/connectors/services/GoogleAdsConnector.ts` | `apps/api/src/connectors/mocks/google-ads.ts` | OAuth access token (`accessToken`), developer token (`apiSecret`), customerId metadata | ⚠️ Requires valid Google Ads developer token; add rate limiting + partial mocks for CI. |
| SHOPIFY | `apps/api/src/connectors/services/ShopifyConnector.ts` | `apps/api/src/connectors/mocks/shopify.ts` | Admin API access token (`apiKey`) + shopDomain metadata | ⚠️ Hits live Admin API; add per-env toggles to prevent accidental writes. |
| STRIPE | `apps/api/src/connectors/services/StripeConnector.ts` | — | `STRIPE_SECRET_KEY` | ⚠️ Connects to live Stripe API; no mock implementation. |
| SLACK | `apps/api/src/connectors/services/SlackConnector.ts` | `apps/api/src/connectors/mocks/slack.ts` | Slack OAuth client & bot token | ⚠️ Live API calls by default; mock unavailable via config. |
| DISCORD | `apps/api/src/connectors/services/DiscordConnector.ts` | — | Discord bot token | ⚠️ Live API only; missing mock. |
| LINKEDIN | `apps/api/src/connectors/services/LinkedInConnector.ts` | `apps/api/src/connectors/mocks/linkedin.ts` | LinkedIn Marketing access token (`accessToken`) + organization/ad account URNs metadata | ⚠️ Relies on production APIs; ensure share + campaign endpoints are stubbed in lower envs. |

Additional connectors bundled today (Notion, Trello, Asana, HubSpot, GoogleSheets, Gmail) are not represented in the `ConnectorKind` enum and will fail `connector.service.ts` casting (`metadata.category` values such as `"communication"` are not valid enum members), preventing Prisma upserts.
