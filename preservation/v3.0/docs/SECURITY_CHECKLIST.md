# Production Security Checklist - NeonHub v3.x

## Overview

This checklist ensures all security measures are properly implemented before and after production deployment.

## 🔒 Pre-Deployment Security Review

### Environment Variables & Secrets
- [ ] **All secrets use strong, unique values** (32+ characters for keys)
- [ ] **No secrets in source code** (use environment variables only)  
- [ ] **Secrets rotation plan** documented (every 90 days minimum)
- [ ] **Environment validation** enforces required variables at startup
- [ ] **DATABASE_URL** uses SSL mode (`?sslmode=require`)

### API Security (Railway/Render)
- [ ] **HTTPS enforcement** (no HTTP endpoints in production)
- [ ] **CORS whitelist** configured (no `*` allowed in production)
- [ ] **Rate limiting** enabled on all endpoints  
- [ ] **Request size limits** configured (prevent DoS)
- [ ] **Authentication** required for sensitive endpoints
- [ ] **Input validation** on all POST/PUT endpoints
- [ ] **SQL injection** prevented (using Prisma ORM)
- [ ] **XSS prevention** (input sanitization)

### Web Application Security (Vercel)  
- [ ] **Security headers** configured in vercel.json:
  - [ ] `Strict-Transport-Security` with preload
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Content Security Policy** (optional but recommended)
- [ ] **Environment variables** validated at build time
- [ ] **Next.js security** features enabled (automatic sanitization)

### Database Security
- [ ] **Connection encryption** (SSL/TLS enforced)
- [ ] **Connection limits** configured appropriately
- [ ] **Backup encryption** enabled
- [ ] **Access control** (minimal required permissions)
- [ ] **Query logging** enabled for auditing
- [ ] **No sensitive data** in plain text (use hashing/encryption)

### External Service Security
- [ ] **Stripe webhook signature** verification implemented
- [ ] **Resend domain verification** completed  
- [ ] **OpenAI API key** has appropriate usage limits
- [ ] **API keys rotation** schedule documented
- [ ] **Service rate limits** monitored and respected

## 🛡️ Runtime Security Monitoring

### Automated Security Scanning
- [ ] **Dependency scanning** in CI pipeline (Trivy)
- [ ] **Security advisories** monitoring (GitHub Dependabot)
- [ ] **Container scanning** (if using Docker)
- [ ] **License compliance** checking

### Application Security Monitoring
- [ ] **Error tracking** with Sentry (configured)
- [ ] **Security incident detection** (unusual traffic patterns)
- [ ] **Failed authentication** monitoring and alerting
- [ ] **Rate limit violations** logging and alerting
- [ ] **Suspicious activity** detection (multiple failed logins, etc.)

### Infrastructure Security  
- [ ] **TLS certificate** auto-renewal (Vercel handles this)
- [ ] **DNS security** (CAA records, DNSSEC if supported)
- [ ] **Platform security** updates (Vercel/Railway/Render handle this)
- [ ] **Access logs** retention and monitoring

## 🔐 Access Control & Authentication

### NextAuth.js Security
- [ ] **NEXTAUTH_SECRET** is cryptographically strong (32+ chars)
- [ ] **Session security** configured properly
- [ ] **OAuth providers** use HTTPS redirect URIs only
- [ ] **Session expiration** appropriate for use case
- [ ] **CSRF protection** enabled (NextAuth default)

### API Authentication
- [ ] **Bearer token** validation on protected routes
- [ ] **Token expiration** enforced
- [ ] **Role-based access** control implemented where needed
- [ ] **API key security** (if using API keys for service-to-service)

### Database Access
- [ ] **Connection pooling** limits configured
- [ ] **Database user** has minimal required permissions
- [ ] **No direct database access** from web (only via API)
- [ ] **Query parameterization** (Prisma handles this)

## 🚨 Incident Response Preparation

### Security Incident Plan
- [ ] **Incident response team** identified
- [ ] **Escalation procedures** documented
- [ ] **Communication plan** prepared
- [ ] **Forensics capability** (log retention, backup access)
- [ ] **Legal requirements** understood (GDPR, etc.)

### Emergency Procedures
- [ ] **API killswitch** capability (rate limit to 0 or disable)
- [ ] **Database connection** emergency disconnect procedure
- [ ] **External service** emergency disable procedures
- [ ] **Rollback procedures** tested and documented
- [ ] **Backup restoration** procedures tested

## 📋 Compliance & Audit Trail

### Data Protection
- [ ] **User data encryption** in transit and at rest
- [ ] **PII handling** compliant with regulations
- [ ] **Data retention** policies implemented
- [ ] **Right to deletion** capability (GDPR Article 17)
- [ ] **Data export** capability (GDPR Article 20)

### Audit Logging
- [ ] **Authentication events** logged
- [ ] **Administrative actions** logged
- [ ] **Data access** logged (for sensitive operations)
- [ ] **Configuration changes** logged
- [ ] **Log integrity** protection (immutable logs)

### Regular Security Reviews
- [ ] **Monthly dependency** updates and security review
- [ ] **Quarterly access** review (remove unused accounts/keys)
- [ ] **Annual security** assessment and penetration testing
- [ ] **Security training** for development team

## 🔧 Security Hardening Implementation

### API Hardening (apps/api/src/server.ts)
```typescript
// Rate limiting (already implemented)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

### Web Hardening (vercel.json)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https://api.yourdomain.com https://api.stripe.com"
        },
        {
          "key": "Permissions-Policy", 
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Environment Security Validation
```typescript
// Enhanced environment validation (already implemented in apps/*/src/config/env.ts)
const envSchema = z.object({
  DATABASE_URL: z.string().refine(url => url.includes('sslmode=require'), {
    message: 'DATABASE_URL must include sslmode=require for production'
  }),
  NEXTAUTH_SECRET: z.string().min(32).refine(secret => 
    /^[A-Za-z0-9+/=]+$/.test(secret), {
    message: 'NEXTAUTH_SECRET must be base64-like for security'
  }),
  // ... other validations
});
```

## 🎯 Security Testing & Validation

### Automated Security Tests
```bash
# Run security-focused tests
npm audit --audit-level high
npx retire --js --outputformat json
docker scan . # if using Docker

# OWASP ZAP baseline scan (optional)
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://yourdomain.com
```

### Manual Security Validation
- [ ] **SQL injection** testing on form inputs
- [ ] **XSS testing** on user-generated content
- [ ] **Authentication bypass** attempts
- [ ] **Authorization boundary** testing
- [ ] **Session management** security testing
- [ ] **File upload** security testing (if applicable)

### Production Security Monitoring
```bash
# Monitor for security events
# API: Check logs for repeated 401/403/429 responses
# Web: Monitor Core Web Vitals for performance attacks
# Database: Monitor connection counts and unusual queries
# External: Monitor API rate limit consumption
```

## 🚀 Post-Deployment Security Validation

### Immediate Post-Deploy (First 24 Hours)
- [ ] **SSL/TLS configuration** validated (SSLLabs.com test)
- [ ] **Security headers** verified (securityheaders.com test)
- [ ] **Vulnerability scan** completed
- [ ] **Performance baseline** established (for DoS detection)
- [ ] **Monitoring alerts** configured and tested

### Ongoing Security Maintenance
- [ ] **Weekly dependency** updates automated
- [ ] **Monthly security** review scheduled
- [ ] **Quarterly penetration** testing scheduled
- [ ] **Annual security** audit scheduled

---

## 🎯 Security Scorecard

After completing this checklist, you should have:
- ✅ **Zero critical vulnerabilities** in dependencies
- ✅ **A+ SSL Labs rating** for HTTPS configuration  
- ✅ **A+ Security Headers rating** 
- ✅ **Comprehensive monitoring** and alerting
- ✅ **Documented incident response** procedures
- ✅ **Regular security review** schedule

**Remember**: Security is an ongoing process, not a one-time checklist. Review and update these measures regularly as threats evolve.



