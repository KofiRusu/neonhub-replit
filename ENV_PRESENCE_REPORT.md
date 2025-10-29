# NeonHub Environment Presence Report

- **Timestamp:** 2025-10-27 19:37:56 UTC
- **Toolchain Notes:**
  - `corepack enable` → permission denied (symlink) under sandbox; left as-is.
  - `corepack prepare pnpm@9 --activate` → blocked by restricted network; pnpm shim available at `./pnpm`.
  - `./pnpm install --frozen-lockfile` → failed offline; `npm ci` attempted next but unsupported for `workspace:*` dependencies.
  - `npx prisma -v` unavailable (Prisma CLI not installed yet); `node -v` → v20.17.0.

## Environment Variable Presence

| Variable | Status |
| --- | --- |
| `DATABASE_URL` | missing |
| `OPENAI_API_KEY` | missing |
| `SMTP_HOST` | missing |
| `SMTP_USER` | missing |
| `SMTP_PASS` | missing |
| `SMTP_PASSWORD` | missing |
| `TWILIO_ACCOUNT_SID` | missing |
| `TWILIO_AUTH_TOKEN` | missing |
| `TWILIO_MESSAGING_SERVICE_SID` | missing |
| `TWITTER_API_KEY` | missing |
| `LINKEDIN_CLIENT_ID` | missing |
| `FACEBOOK_APP_ID` | missing |
| `INSTAGRAM_APP_ID` | missing |

**Summary:** No required secrets detected in current shell environment; package installs blocked by offline workspace constraints.
