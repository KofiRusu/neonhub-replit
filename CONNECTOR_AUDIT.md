# Connector Audit — 2025-10-27

| ConnectorKind | Runtime Implementation | Mock Asset | Env / Secret Expectations | Status |
| --- | --- | --- | --- | --- |
| EMAIL | `apps/api/src/connectors/services/GmailConnector.ts` (Gmail OAuth) | `apps/api/src/connectors/mocks/email.ts` (fixtures only) | Requires Google OAuth client + tokens (unset) | ⚠️ Implementation assumes live Gmail API; mock not wired into registry/tests. |
| SMS | — | — | Twilio-style credentials | ❌ No connector class; enum unused. |
| WHATSAPP | — | — | Twilio/Meta credentials | ❌ Missing. |
| REDDIT | — | `apps/api/src/connectors/mocks/social.ts` (generic) | Reddit API keys | ❌ No runtime connector. |
| INSTAGRAM | — | `apps/api/src/connectors/mocks/social.ts` | Meta Graph credentials | ❌ No runtime connector. |
| FACEBOOK | — | `apps/api/src/connectors/mocks/social.ts` | Meta Graph credentials | ❌ No runtime connector. |
| X (Twitter) | `apps/api/src/connectors/services/TwitterConnector.ts` | `apps/api/src/connectors/mocks/social.ts` | Twitter API key/secret | ⚠️ Uses live REST calls; no toggle for mock mode. |
| YOUTUBE | — | — | Google API key | ❌ Missing. |
| TIKTOK | — | — | TikTok Business API credentials | ❌ Missing. |
| GOOGLE_ADS | — | — | Google Ads developer token | ❌ Missing. |
| SHOPIFY | — | — | Shopify API key/secret | ❌ Missing. |
| STRIPE | `apps/api/src/connectors/services/StripeConnector.ts` | — | `STRIPE_SECRET_KEY` | ⚠️ Connects to live Stripe API; no mock implementation. |
| SLACK | `apps/api/src/connectors/services/SlackConnector.ts` | `apps/api/src/connectors/mocks/slack.ts` | Slack OAuth client & bot token | ⚠️ Live API calls by default; mock unavailable via config. |
| DISCORD | `apps/api/src/connectors/services/DiscordConnector.ts` | — | Discord bot token | ⚠️ Live API only; missing mock. |
| LINKEDIN | — | — | LinkedIn Marketing API credentials | ❌ Missing. |

Additional connectors bundled today (Notion, Trello, Asana, HubSpot, GoogleSheets, Gmail) are not represented in the `ConnectorKind` enum and will fail `connector.service.ts` casting (`metadata.category` values such as `"communication"` are not valid enum members), preventing Prisma upserts.
