# Web Staging Environment Template

Copy to `.env.staging` and fill in actual values:

```env
# API
NEXT_PUBLIC_API_URL=https://api.staging.neonhubecosystem.com

# Site
NEXT_PUBLIC_SITE_URL=https://app.staging.neonhubecosystem.com

# NextAuth
NEXTAUTH_SECRET=<same-as-api>
NEXTAUTH_URL=https://app.staging.neonhubecosystem.com
DATABASE_URL=<same-as-api>

# OAuth
GITHUB_ID=***
GITHUB_SECRET=***
GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_***

# Environment
NODE_ENV=staging
```

