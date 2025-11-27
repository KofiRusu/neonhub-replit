# API Staging Environment Template

Copy to `.env.staging` and fill in actual values:

```env
# Database (Neon.tech staging)
DATABASE_URL=postgresql://neondb_owner:***@ep-polished-flower-aefsjkya-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Server
NODE_ENV=staging
PORT=4100
CORS_ORIGINS=https://app.staging.neonhubecosystem.com

# Auth
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_SECRET=<generate-secure-jwt-secret>

# AI
OPENAI_API_KEY=sk-proj-***

# Stripe (test mode)
STRIPE_SECRET_KEY=sk_test_***
STRIPE_WEBHOOK_SECRET=whsec_***

# Email
RESEND_API_KEY=re_***

# OAuth
GOOGLE_CLIENT_ID=***.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=***
LINKEDIN_CLIENT_ID=***
LINKEDIN_CLIENT_SECRET=***

# Feature Flags
USE_MOCK_CONNECTORS=false
```

