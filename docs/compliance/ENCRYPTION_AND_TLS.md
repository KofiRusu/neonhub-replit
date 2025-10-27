# NeonHub Encryption & TLS Readiness

This checklist captures the minimum controls required to keep customer data encrypted at rest and in transit while satisfying GDPR/SOC2/PCI guardrails. Pair it with `SECURITY.md` for operational responses.

## Key Management Controls

- **Required Secrets**: `ENCRYPTION_KEY`, `JWT_SECRET`, `NEXTAUTH_SECRET`, `STRIPE_WEBHOOK_SECRET`.
- **Generation**:
  - `ENCRYPTION_KEY` → `openssl rand -hex 32` (exactly 64 hex chars).
  - `JWT_SECRET` & `NEXTAUTH_SECRET` → `openssl rand -base64 32`.
- **Storage**: load secrets from GitHub Actions / Vercel project settings or a dedicated secrets manager (Vault, AWS Secrets Manager). Never persist them in source control or shared Slack/Notion spaces.
- **Rotation**: rotate encryption and auth secrets quarterly or immediately after a suspected compromise. Document rotation in the Ops runbook.
- **Access**: restrict write access to production secrets to the security/infra group; enable audit logging where supported.

## HTTPS / TLS Configuration

- **Certificate Authority**: issue certificates through Let’s Encrypt, AWS ACM, or another trusted CA. Auto-renew at ≤30-day intervals.
- **Strict Transport Security**: enable `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Redirects**: force HTTP → HTTPS at the edge (Vercel) and within the API reverse proxy.
- **Cipher Suites**: rely on TLS 1.2+ defaults provided by hosting platforms; disable legacy protocols (SSLv3/TLS1.0).
- **Verification**: after every deploy, run `curl -Iv https://{domain}` and confirm:
  - certificate chain is valid,
  - `Strict-Transport-Security` header present,
  - redirects terminate on HTTPS.

## Compliance Mapping

| Control | Requirement | Notes |
| --- | --- | --- |
| Encryption key generation & rotation | PCI DSS 3.6 / SOC 2 CC6 | Secrets generated via `openssl`, rotation tracked in Ops flywheel |
| HTTPS enforced w/ HSTS | PCI DSS 4.1 / OWASP ASVS V9 | Automatic redirects + HSTS header |
| Secret storage in managed vault | SOC 2 CC2.1 | GitHub Secrets / Vercel secrets with least-privilege access |

Maintain this document as common evidence for security reviews and link to it from onboarding/runbooks so new engineers can follow the exact commands.
