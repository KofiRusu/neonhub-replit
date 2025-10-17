# Integration Validation Guide - Phase F

## Overview

This guide covers validation of critical external service integrations: Stripe payments, Resend email, and OpenAI completions.

## Stripe Webhook Validation

### Current Implementation
- **Webhook Route**: `POST /billing/webhook`
- **Events Handled**: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed
- **Security**: Signature verification via `STRIPE_WEBHOOK_SECRET`

### Local Development Testing

#### 1. Install Stripe CLI
```bash
# Install Stripe CLI
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-buster-debsig main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe

# Or via npm
npm install -g stripe-cli
```

#### 2. Local Webhook Testing
```bash
# Login to Stripe (requires account)
stripe login

# Forward webhooks to local API
stripe listen --forward-to localhost:3001/billing/webhook

# Copy webhook signing secret from output
# Set STRIPE_WEBHOOK_SECRET=whsec_...

# In another terminal, trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### Production Webhook Setup

#### 1. Create Webhook Endpoint
```bash
# Stripe Dashboard > Developers > Webhooks > Add endpoint
# URL: https://api.yourdomain.com/billing/webhook
# Events to listen for:
# - checkout.session.completed
# - customer.subscription.updated  
# - customer.subscription.deleted
# - invoice.paid
# - invoice.payment_failed
```

#### 2. Configure Webhook Secret
```bash
# Copy signing secret from Stripe dashboard
# Set STRIPE_WEBHOOK_SECRET in production environment
```

#### 3. Test Production Webhook
```bash
# Send test event from Stripe dashboard
# Or use validation script (see below)
```

### Validation Checklist
- [ ] Webhook endpoint responds with 200 status
- [ ] Signature verification works correctly
- [ ] All event types are handled (logged at minimum)
- [ ] Database updates work (when implemented)
- [ ] Failed payments trigger appropriate actions

## Resend Email Validation

### Current Implementation
- **Service**: `team/invite.ts`
- **Features**: Team invitations, HTML templates, fallback to mock mode
- **Sender**: `invites@neonhub.ai` (requires domain verification)

### Domain Verification (Required for Production)

#### 1. Add Domain in Resend
```bash
# Resend Console > Domains > Add Domain
# Domain: yourdomain.com (or subdomain like mail.yourdomain.com)
```

#### 2. Configure DNS Records
```bash
# Add these DNS records (provided by Resend):
TXT _resend yourdomain.com "v=spf1 include:_spf.resend.com ~all"
CNAME resend._domainkey yourdomain.com resend._domainkey.resend.com
CNAME resend2._domainkey yourdomain.com resend2._domainkey.resend.com

# Optional: DMARC record for better deliverability
TXT _dmarc yourdomain.com "v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"
```

### Email Testing

#### 1. Test API Endpoint
```bash
# Test team invitation endpoint (requires authentication)
curl -X POST https://api.yourdomain.com/team/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "email": "test@example.com",
    "role": "member"
  }'
```

#### 2. Direct Service Test
```bash
# Create test script to call sendInviteEmail directly
# Check logs for success/failure and message ID
```

### Validation Checklist
- [ ] Domain DNS records configured correctly
- [ ] Test email sends successfully and arrives in inbox
- [ ] HTML template renders correctly in major email clients
- [ ] Message ID is returned and logged
- [ ] Fallback mock mode works when RESEND_API_KEY not set
- [ ] Email links work correctly (invitation acceptance)

## OpenAI Integration Validation

### Current Implementation
- **Service**: Used in multiple agents (`AdAgent`, `InsightAgent`, etc.)
- **Model**: GPT-4
- **Features**: Content generation, ad copy creation, insights analysis

### API Key Testing

#### 1. Validate API Key
```bash
# Test OpenAI API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Should return list of available models
```

#### 2. Test Completion Endpoint
```bash
# Test minimal completion
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 10
  }'
```

### Agent Testing

#### 1. Test Ad Agent
```bash
# Test ad generation endpoint
curl -X POST https://api.yourdomain.com/agents/ad \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "product": "AI marketing platform",
    "audience": "small business owners", 
    "platform": "google",
    "tone": "professional"
  }'
```

#### 2. Test Content Generation
```bash
# Test content creation endpoint
curl -X POST https://api.yourdomain.com/api/content/generate-post \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "topic": "AI in marketing",
    "audience": "marketers",
    "tone": "informative"
  }'
```

### Validation Checklist  
- [ ] API key is valid and has sufficient credits
- [ ] GPT-4 model access is available
- [ ] Completion requests return valid responses
- [ ] Rate limiting is handled gracefully
- [ ] Error responses are handled appropriately
- [ ] Token usage is logged for cost monitoring

## Security Considerations

### Environment Variables
```bash
# Ensure all secrets are properly configured
echo "STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:7}..."
echo "STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET:0:7}..."
echo "RESEND_API_KEY: ${RESEND_API_KEY:0:7}..."
echo "OPENAI_API_KEY: ${OPENAI_API_KEY:0:7}..."
```

### API Rate Limits
- **Stripe**: 100 requests/second per account
- **Resend**: Varies by plan (1,000-50,000 emails/month)
- **OpenAI**: Varies by usage tier ($5-$1000+ monthly spend)

### Error Handling
- All services implement proper error handling
- Fallback modes available (Stripe: sandbox, Resend: mock, OpenAI: cached responses)
- Logging configured for debugging and monitoring

## Monitoring & Alerts

### Key Metrics to Track
- **Stripe**: Successful vs failed payments, webhook delivery success
- **Resend**: Email delivery rates, bounce rates, spam complaints
- **OpenAI**: Token usage, request latency, error rates

### Recommended Alerting
- Webhook delivery failures > 5% 
- Email bounce rate > 10%
- OpenAI API errors > 1%
- Service downtime > 1 minute

## Troubleshooting Common Issues

### Stripe Webhooks
- **400 errors**: Check webhook secret matches
- **Timeout errors**: Ensure handler responds quickly (<10s)
- **Missing events**: Verify endpoint URL and event selection

### Resend Email
- **Authentication errors**: Verify API key and domain verification
- **Delivery issues**: Check DNS records and sender reputation
- **Template issues**: Test HTML in multiple email clients

### OpenAI API
- **Rate limiting**: Implement exponential backoff
- **Token limits**: Monitor usage and implement safeguards
- **Model availability**: Have fallback to GPT-3.5 if GPT-4 unavailable

---

**Next Phase**: After validation, proceed to Phase G (DNS & SSL Configuration)



