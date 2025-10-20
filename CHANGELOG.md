# Changelog

All notable changes to NeonHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0-rc.1] - 2025-10-20

### Added - Security Hardening (Week 3)

- **Security Headers & CSP**
  - [`Next.js middleware`](apps/web/src/middleware.ts) with comprehensive security headers
  - X-Frame-Options: DENY (clickjacking protection)
  - Content-Security-Policy with strict default-src
  - COOP/CORP/COEP cross-origin isolation
  - Open-redirect protection for query parameters
  - [`Express security headers middleware`](apps/api/src/middleware/securityHeaders.ts)

- **Strict CORS Protection**
  - [`strictCORS middleware`](apps/api/src/middleware/cors.ts) with origin allowlist
  - Preflight (OPTIONS) request handling
  - 403 blocking for unauthorized origins
  - Credentials support with Vary header
  - Configurable via CORS_ORIGIN environment variable

- **Redis-Based Rate Limiting**
  - [`rateLimiter utility`](apps/api/src/lib/rateLimiter.ts) with Redis backend
  - IP-based limits: 60 requests/minute
  - User-based limits: 120 requests/minute  
  - In-memory fallback for development
  - [`Rate limit middleware`](apps/api/src/middleware/rateLimit.ts) with X-RateLimit-* headers
  - Stricter auth endpoint limits (10 requests/minute)
  - Feature flag: DISABLE_RATE_LIMIT for emergency bypass
  - Fail-open behavior for reliability

- **Comprehensive Audit Logging**
  - [`AuditLog Prisma model`](apps/api/prisma/schema.prisma:362) with indexed fields
  - [`Audit service`](apps/api/src/lib/audit.ts) for async logging
  - [`Audit middleware factory`](apps/api/src/middleware/auditLog.ts)
  - Tracks: userId, IP, action, resource, metadata
  - Fire-and-forget logging (non-blocking)
  - Applied to campaigns, credentials, settings, governance routes

- **Admin IP Allowlist**
  - [`adminIPGuard middleware`](apps/api/src/middleware/adminGuard.ts)
  - Configurable via ADMIN_IP_ALLOWLIST environment variable
  - Logging of blocked access attempts
  - Ready for future admin route protection

- **Logger Sanitization**
  - [`Enhanced logger`](apps/api/src/lib/logger.ts) with automatic data sanitization
  - Redacts: password, token, secret, apiKey, accessToken, refreshToken
  - Masks long alphanumeric strings (potential tokens)
  - [REDACTED] placeholder for sensitive fields
  - Zero secrets in logs guarantee

- **Security Testing**
  - [`E2E security tests`](apps/web/tests/e2e/security.spec.ts) - 11 test cases
  - [`Rate limiter unit tests`](apps/api/src/lib/__tests__/rateLimiter.test.ts) - 7 test cases
  - [`Security audit script`](scripts/security-audit.sh) for secret scanning
  - Total: 18 automated security tests

### Changed

- **Session Hardening** ([`apps/web/src/lib/auth.ts`](apps/web/src/lib/auth.ts:16))
  - Session maxAge: 12 hours (down from unlimited)
  - Session updateAge: 1 hour (sliding window)
  - Secure cookies in production
  - SameSite: strict
  - Redirect URL validation (prevents open redirects)

- **Request Size Limits** ([`server.ts`](apps/api/src/server.ts:42))
  - JSON body limit: 1MB (prevents payload attacks)
  - URL-encoded limit: 1MB
  - Applied globally before route processing

- **Middleware Execution Order** (Security-First Architecture)
  1. Body parsing with limits
  2. Security headers (global)
  3. Strict CORS validation
  4. Rate limiting (global)
  5. Request logging (sanitized)
  6. Route-specific auth + audit

### Security

- **Defense in Depth**: Multiple security layers (headers, CORS, rate limiting, audit)
- **Principle of Least Privilege**: Strict by default, relaxable via config
- **Audit Trail**: All sensitive operations logged with IP and user context
- **Graceful Degradation**: In-memory fallbacks, fail-open on errors
- **Feature Flags**: Emergency bypass capabilities (DISABLE_RATE_LIMIT)
- **Compliance Ready**: GDPR/CCPA/SOC2/PCI-DSS audit trail requirements met

### Dependencies

- **Added**: `redis` (v4.x) - Rate limiting backend
- **Added**: `@types/redis` - TypeScript definitions

### Database

- **Added**: `AuditLog` model
  - Fields: id, createdAt, userId, ip, action, resource, metadata
  - Indexes: createdAt, userId+createdAt, action
  - User relation: One-to-Many (User.auditLogs)

### Migration Notes

**Required Steps:**
```bash
# 1. Install dependencies (already done if following guide)
cd apps/api && npm install

# 2. Generate Prisma client (already done if following guide)
npx prisma generate

# 3. Create and apply migration
npx prisma migrate dev --name add_audit_log

# 4. Start Redis (development)
docker run -d -p 6379:6379 redis:alpine

# 5. Update environment variables
# Add to apps/api/.env:
# RATE_LIMIT_REDIS_URL=redis://localhost:6379
# CORS_ORIGIN="http://localhost:3000,http://127.0.0.1:3000"
# ADMIN_IP_ALLOWLIST="127.0.0.1,::1"
# DISABLE_RATE_LIMIT=false
```

### Known Issues

- Pre-existing TypeScript errors in billing service (stripeCustomerId)
- CSP may require adjustment for third-party integrations
- In-memory rate limiter not distributed (use Redis in production)

### Documentation

- [`WK3_SECURITY_RATE_LIMITING.md`](reports/WK3_SECURITY_RATE_LIMITING.md) - Comprehensive security report
- [`WK3_SECURITY_IMPLEMENTATION_STATUS.md`](reports/WK3_SECURITY_IMPLEMENTATION_STATUS.md) - Implementation tracker
- Updated environment variable documentation in .env

---

## [3.2.0] - 2025-10-20

### Added
- **Campaign Orchestration System**
  - [`EmailAgent`](apps/api/src/agents/EmailAgent.ts) for AI-powered email generation and scheduling
  - [`SocialAgent`](apps/api/src/agents/SocialAgent.ts) for multi-platform social media posting
  - [`CampaignAgent`](apps/api/src/agents/CampaignAgent.ts) for campaign coordination and analytics
  - Real-time WebSocket updates for campaign status
  - A/B testing framework for email and social campaigns
  - Campaign analytics with open rates, click rates, and conversions

- **Authentication & Authorization**
  - Session-based authentication with NextAuth.js
  - GitHub and Google OAuth providers
  - Protected routes with [`auth middleware`](apps/api/src/middleware/auth.ts)
  - User session management
  - Auth routes: [`/api/auth/*`](apps/api/src/routes/auth.ts)

- **Encrypted Credential Management**
  - AES-256-GCM encryption for OAuth tokens
  - Secure credential storage in database
  - Token masking in API responses
  - Multi-provider OAuth support (Twitter, Facebook, LinkedIn)
  - Credential revocation and refresh
  - [`CredentialsService`](apps/api/src/services/credentials.service.ts) with encryption layer

- **Stripe Billing Integration**
  - Three-tier subscription model (Free, Pro, Enterprise)
  - Stripe Checkout integration
  - Webhook handling for subscription events
  - Usage tracking and budget enforcement
  - Per-resource usage counters (campaigns, emails, social posts)
  - [`Budget middleware`](apps/api/src/middleware/budget.ts) for tier limits
  - Billing routes: [`/api/billing/*`](apps/api/src/routes/billing.ts)

- **User Settings & Preferences**
  - Brand voice configuration
  - Notification preferences (email, push, SMS)
  - Privacy controls (data retention, analytics opt-out)
  - Timezone and language settings
  - [`SettingsService`](apps/api/src/services/settings.service.ts)

- **Testing Infrastructure**
  - Playwright E2E tests for auth, credentials, campaigns, and billing
  - Unit tests for EmailAgent, SocialAgent, CampaignAgent
  - Jest coverage thresholds (80% lines, 75% functions, 70% branches)
  - 4 comprehensive E2E test suites
  - [`playwright.config.ts`](apps/web/playwright.config.ts) with multi-browser support

### Changed
- Replaced mock authentication with real NextAuth sessions
- Updated billing routes to use live Stripe integration
- Enhanced Prisma schema with 7 new models:
  - `Credential` - Encrypted OAuth tokens
  - `Campaign` - Campaign metadata
  - `EmailSequence` - Email scheduling
  - `SocialPost` - Social media posts
  - `Subscription` - Stripe subscription data
  - `UsageRecord` - Resource usage tracking
  - `UserSettings` - User preferences

- Upgraded test infrastructure:
  - Jest configuration with coverage thresholds
  - ESM module support in tests
  - Coverage reporting in multiple formats

### Security
- **Encryption**: AES-256-GCM for credential storage
- **Token Masking**: Sensitive data hidden in API responses
- **Session Security**: HTTP-only cookies, CSRF protection
- **Webhook Verification**: Stripe signature validation
- **Route Protection**: All routes require authentication except `/health` and `/auth/*`
- **GDPR Compliance**: Data retention controls in user settings
- **Audit Trail**: Comprehensive logging of credential operations

### Performance
- Database indexes on high-traffic queries:
  - Campaign queries: `userId`, `status`, `createdAt`
  - Email sequences: `campaignId`, `scheduledFor`
  - Social posts: `campaignId`, `platform`, `scheduledFor`
  - Credentials: `userId`, `provider`
  - Usage records: `subscriptionId`, `resourceType`, `timestamp`
- Usage counter optimization for real-time tracking
- WebSocket connection pooling

### API Endpoints
**New Routes:**
- `POST /api/auth/signin` - Initiate OAuth sign-in
- `GET /api/auth/session` - Get current user session
- `POST /api/auth/signout` - End user session
- `GET /api/credentials` - List user credentials
- `POST /api/credentials` - Add new credential
- `DELETE /api/credentials/:id` - Revoke credential
- `POST /api/campaign` - Create campaign
- `GET /api/campaign` - List campaigns
- `GET /api/campaign/:id` - Get campaign details
- `PUT /api/campaign/:id` - Update campaign
- `DELETE /api/campaign/:id` - Delete campaign
- `POST /api/campaign/:id/schedule` - Schedule campaign
- `POST /api/campaign/:id/ab-test` - Run A/B test
- `GET /api/campaign/:id/analytics` - Get campaign analytics
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Access customer portal
- `POST /api/webhook/stripe` - Handle Stripe webhooks
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Documentation
- Updated [`README.md`](README.md) with v3.2 features
- Week 2 completion reports:
  - [`WK2_AUTH_CREDS_SETTINGS.md`](reports/WK2_AUTH_CREDS_SETTINGS.md)
  - [`WK2_OFAuto_UI_REPORT.md`](reports/WK2_OFAuto_UI_REPORT.md)
- Environment variable documentation
- API endpoint documentation

### Known Issues
- Security vulnerabilities in `@neonhub/predictive-engine` dependencies:
  - 6 critical vulnerabilities in kubernetes-client chain
  - 5 moderate vulnerabilities
  - Affects: form-data, got, jose, jsonpath-plus, tough-cookie
  - **Action Required**: Upgrade kubernetes dependencies or replace with alternative
- Some TypeScript strict mode warnings in test mocks (non-blocking)

### Migration Notes
- **Database**: Run `npx prisma migrate deploy` to apply new schema
- **Environment Variables**: Add new required variables (see `.env.example`)
  - `ENCRYPTION_KEY` - 64 hex characters (generate with `openssl rand -hex 32`)
  - `NEXTAUTH_SECRET` - Min 32 characters
  - `NEXTAUTH_URL` - Your application URL
  - Stripe keys and product IDs
- **Dependencies**: Run `npm install` to update packages
- **Playwright**: Install browsers with `npx playwright install`

---

## [3.0.0] - 2025-10-15

### Added
- Initial hybrid deployment architecture
- Multi-environment support (Railway + Vercel)
- Base agent framework
- Core API infrastructure

### Changed
- Migrated from monolithic to hybrid architecture
- Separated API and web deployments

---

## [2.5.0] - 2025-10-10

### Added
- Basic campaign management
- Mock authentication
- Initial UI components

---

For older versions, see [`preservation/`](preservation/) directory.