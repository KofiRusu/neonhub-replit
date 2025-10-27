# Stripe Integration Test Plan

**Version:** 1.0  
**Last Updated:** 2025-10-26  
**Environment:** Test Mode (Staging)

---

## Overview

This document outlines the testing strategy for Stripe integration in NeonHub, covering payment processing, subscription management, and webhook handling.

---

## Prerequisites

### 1. Stripe Test Account Setup

```bash
# 1. Create Stripe account at https://dashboard.stripe.com/register
# 2. Enable Test Mode (toggle in dashboard)
# 3. Get API keys from: https://dashboard.stripe.com/test/apikeys
```

### 2. Environment Variables

```bash
# Add to apps/api/.env
STRIPE_SECRET_KEY=sk_test_your-test-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Add to GitHub Actions secrets
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Add to Vercel (web app)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Verify
stripe --version
```

---

## Test Scenarios

### Scenario 1: Test Customers

Stripe provides test card numbers for different scenarios:

| Card Number | Brand | Scenario |
|-------------|-------|----------|
| `4242 4242 4242 4242` | Visa | Success |
| `5555 5555 5555 4444` | Mastercard | Success |
| `4000 0025 0000 3155` | Visa | 3D Secure |
| `4000 0000 0000 9995` | Visa | Declined (insufficient funds) |
| `4000 0000 0000 0002` | Visa | Declined (generic) |

**Test Card Details:**
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

---

### Scenario 2: Checkout Flow

#### Test Steps

1. **Create Checkout Session**
   ```bash
   curl -X POST http://localhost:3001/api/stripe/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <user-token>" \
     -d '{
       "priceId": "price_...",
       "successUrl": "http://localhost:3000/success",
       "cancelUrl": "http://localhost:3000/cancel"
     }'
   ```

2. **Complete Payment**
   - Navigate to returned `url`
   - Enter test card: `4242 4242 4242 4242`
   - Complete checkout

3. **Verify Subscription Created**
   ```bash
   curl http://localhost:3001/api/subscriptions \
     -H "Authorization: Bearer <user-token>"
   ```

#### Expected Results

- ✅ Checkout session created
- ✅ Payment successful
- ✅ Subscription created in database
- ✅ Webhook received
- ✅ User redirected to success page

---

### Scenario 3: Customer Portal

#### Test Steps

1. **Create Portal Session**
   ```bash
   curl -X POST http://localhost:3001/api/stripe/portal \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <user-token>"
   ```

2. **Access Portal**
   - Navigate to returned `url`
   - Update payment method
   - Cancel subscription
   - Reactivate subscription

3. **Verify Changes**
   ```bash
   curl http://localhost:3001/api/subscriptions \
     -H "Authorization: Bearer <user-token>"
   ```

#### Expected Results

- ✅ Portal session created
- ✅ Payment method updated
- ✅ Subscription canceled/reactivated
- ✅ Webhooks received
- ✅ Database updated

---

### Scenario 4: Webhook Events

#### Setup Local Webhook Listener

```bash
# Terminal 1: Start API server
cd /Users/kofirusu/Desktop/NeonHub
npm run dev --filter apps/api

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3001/api/stripe/webhook

# Note the webhook signing secret:
# whsec_...
```

#### Test Events

```bash
# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

#### Verify Webhook Handling

```bash
# Check API logs for webhook events
# Expected format:
# [INFO] Webhook received: payment_intent.succeeded
# [INFO] Processing payment intent: pi_...
# [INFO] Payment successful for customer: cus_...
```

---

## Webhook Implementation

### API Endpoint

**File:** `apps/api/src/routes/stripe-webhook.ts`

```typescript
import { Router } from 'express';
import Stripe from 'stripe';
import { logger } from '../lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const stripeWebhookRouter = Router();

stripeWebhookRouter.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    logger.error({ err }, 'Webhook signature verification failed');
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log event
  logger.info({ type: event.type, id: event.id }, 'Webhook received');

  // Handle event
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    default:
      logger.warn({ type: event.type }, 'Unhandled event type');
  }

  res.json({ received: true });
});
```

### Event Handlers

```typescript
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  await prisma.subscription.create({
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      userId: /* get from customer metadata */,
      status: subscription.status,
      plan: /* determine from price */,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  await prisma.invoice.create({
    data: {
      stripeInvoiceId: invoice.id,
      subscriptionId: /* get from DB */,
      amountPaid: invoice.amount_paid,
      status: 'paid',
      paidAt: new Date(),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Notify user of payment failure
  // Update subscription status
}
```

---

## Test Matrix

### Subscription Lifecycle

| Test | Method | Expected Result | Status |
|------|--------|-----------------|--------|
| Create subscription | POST /api/stripe/checkout | Session created, subscription active | ⏸️ Pending |
| Update payment method | Portal | Payment method updated | ⏸️ Pending |
| Cancel subscription | Portal | Subscription canceled at period end | ⏸️ Pending |
| Reactivate subscription | Portal | Subscription reactivated | ⏸️ Pending |
| Subscription expires | Webhook | Status updated to 'past_due' | ⏸️ Pending |

### Payment Scenarios

| Test | Card | Expected Result | Status |
|------|------|-----------------|--------|
| Successful payment | `4242 4242 4242 4242` | Payment succeeds | ⏸️ Pending |
| Declined payment | `4000 0000 0000 9995` | Payment declined error | ⏸️ Pending |
| 3D Secure | `4000 0025 0000 3155` | Additional auth required | ⏸️ Pending |
| Expired card | Expiry in past | Card declined error | ⏸️ Pending |

### Webhook Events

| Event | Handler | Expected Result | Status |
|-------|---------|-----------------|--------|
| `customer.subscription.created` | Create subscription in DB | Subscription record created | ⏸️ Pending |
| `customer.subscription.updated` | Update subscription in DB | Subscription updated | ⏸️ Pending |
| `customer.subscription.deleted` | Mark as canceled | Status = canceled | ⏸️ Pending |
| `invoice.paid` | Create invoice record | Invoice created | ⏸️ Pending |
| `invoice.payment_failed` | Send failure notification | Email sent, status updated | ⏸️ Pending |

---

## Automated Testing

### Unit Tests

```typescript
// apps/api/src/__tests__/stripe.test.ts
import { handleSubscriptionCreated } from '../services/stripe';
import { prismaMock } from './setup';

describe('Stripe Webhook Handlers', () => {
  it('should create subscription on customer.subscription.created', async () => {
    const mockSubscription = {
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      current_period_start: 1609459200,
      current_period_end: 1612137600,
    };

    await handleSubscriptionCreated(mockSubscription);

    expect(prismaMock.subscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        stripeSubscriptionId: 'sub_test123',
        status: 'active',
      }),
    });
  });
});
```

### Integration Tests

```typescript
// apps/api/src/__tests__/integration/stripe.test.ts
import request from 'supertest';
import { app } from '../../server';
import Stripe from 'stripe';

describe('POST /api/stripe/checkout', () => {
  it('should create checkout session', async () => {
    const response = await request(app)
      .post('/api/stripe/checkout')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        priceId: 'price_test123',
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body.url).toContain('checkout.stripe.com');
  });
});
```

---

## Production Checklist

### Before Going Live

- [ ] Switch to live API keys
- [ ] Update webhook URL in Stripe dashboard
- [ ] Configure webhook signing secret
- [ ] Test with real (small amount) payment
- [ ] Verify refund process
- [ ] Set up payment failure notifications
- [ ] Configure Stripe tax settings
- [ ] Review Stripe Radar rules
- [ ] Enable payment receipts
- [ ] Configure customer portal
- [ ] Test subscription cancellation
- [ ] Verify proration logic
- [ ] Set up billing alerts

### Monitoring

- [ ] Add Stripe webhook monitoring to Sentry
- [ ] Set up alerts for failed payments
- [ ] Monitor subscription churn rate
- [ ] Track revenue metrics
- [ ] Monitor webhook delivery rates

---

## Troubleshooting

### Webhook Not Receiving Events

```bash
# Check webhook endpoint
curl -X POST http://localhost:3001/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check Stripe CLI logs
stripe logs tail

# Verify webhook secret
echo $STRIPE_WEBHOOK_SECRET
```

### Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Use raw request body (not parsed JSON)
- Check Stripe-Signature header is present

### Payment Declined

- Verify test card number
- Check Stripe dashboard for decline reason
- Review Stripe Radar rules

---

## Stripe Dashboard

### Key Sections

| Section | URL | Purpose |
|---------|-----|---------|
| Payments | `/test/payments` | View all payments |
| Customers | `/test/customers` | Manage customers |
| Subscriptions | `/test/subscriptions` | View subscriptions |
| Webhooks | `/test/webhooks` | Configure webhooks |
| Logs | `/test/logs` | Debug issues |

---

## Reference Documentation

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## Contact

**For Stripe Issues:**
- Finance: finance@neonhubecosystem.com
- DevOps: devops@neonhubecosystem.com
- Slack: #payments

---

**Status:** Documentation Complete  
**Next Step:** Implement webhook handlers and run tests  
**Owner:** Engineering + Finance Teams

