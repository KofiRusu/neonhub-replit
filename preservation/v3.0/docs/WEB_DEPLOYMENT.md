# Web App Deployment Guide - Vercel

## Overview

This guide covers deploying the NeonHub web application to Vercel with zero-downtime deployment and optimal performance configuration.

## Pre-Deployment Checklist

- [ ] API deployed and health endpoint accessible
- [ ] Database provisioned and accessible from web app
- [ ] All environment variables prepared (see `docs/ENV.MD`)
- [ ] Web app builds successfully locally
- [ ] Custom domain DNS ready (optional)

## Vercel Deployment

### Why Vercel?
- ✅ Built specifically for Next.js applications
- ✅ Global edge network and CDN
- ✅ Automatic SSL certificates
- ✅ Zero-configuration deployments
- ✅ Excellent GitHub integration
- ✅ Built-in analytics and Core Web Vitals monitoring

### Deployment Methods

#### Method 1: Vercel Dashboard (Recommended)

1. **Create Vercel Account**
   ```bash
   # Visit: https://vercel.com
   # Sign up with GitHub/GitLab
   ```

2. **Import Project**
   ```bash
   # Dashboard > New Project > Import Git Repository
   # Select: your-org/neonhub
   # Framework Preset: Next.js (auto-detected)
   # Root Directory: apps/web
   ```

3. **Configure Build Settings**
   ```bash
   # Build Command: npm run build
   # Output Directory: .next (auto-detected)
   # Install Command: npm install && npx prisma generate
   # Development Command: npm run dev
   ```

4. **Environment Variables**
   ```bash
   # Add each variable from docs/ENV.MD:
   NEXT_PUBLIC_SITE_URL=https://app.yourdomain.com
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com  
   NEXTAUTH_URL=https://app.yourdomain.com
   NEXTAUTH_SECRET=your-32-char-secret
   DATABASE_URL=postgresql://... (if needed for NextAuth)
   NODE_ENV=production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   
   # Optional
   SENTRY_DSN=https://...@sentry.io/...
   ```

5. **Deploy**
   ```bash
   # Click "Deploy" button
   # Wait for build completion (~2-5 minutes)
   # Automatic deployment on future git pushes
   ```

#### Method 2: Vercel CLI

1. **Install CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login and Deploy**
   ```bash
   # From workspace root
   cd apps/web
   vercel login
   vercel --prod
   
   # Follow prompts:
   # Project name: neonhub-web
   # Framework: Next.js
   # Build Command: npm run build
   # Output Directory: .next
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SITE_URL production
   vercel env add NEXT_PUBLIC_API_URL production
   vercel env add NEXTAUTH_URL production
   vercel env add NEXTAUTH_SECRET production
   # ... continue for all variables
   ```

### Custom Domain Configuration

#### 1. Add Domain in Vercel
```bash
# Vercel Dashboard > Project > Settings > Domains
# Add custom domain: app.yourdomain.com
# Vercel will provide DNS instructions
```

#### 2. DNS Configuration
```bash
# Add CNAME record:
# Name: app (or @)
# Value: cname.vercel-dns.com
# OR A record if using apex domain:
# Value: 76.76.19.61 (Vercel's IP)
```

#### 3. SSL Certificate
```bash
# Automatic via Vercel (Let's Encrypt)
# Usually takes 5-10 minutes after DNS propagation
```

### Performance Optimization

#### 1. Vercel Configuration
```json
// vercel.json (updated)
{
  "version": 2,
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm ci && npx prisma generate",
  "regions": ["iad1", "sfo1"],
  "functions": {
    "apps/web/src/app/api/**": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

#### 2. Next.js Optimization  
```typescript
// next.config.ts (already optimized)
// - Image optimization enabled
// - Standalone output for better performance
// - Security headers configured
// - Compression enabled
```

#### 3. Environment-Specific Settings
```bash
# Production optimizations already in next.config.ts:
# - Bundle analyzer (conditional)
# - Source maps disabled in production
# - Minification enabled
# - Tree shaking enabled
```

## Post-Deployment Configuration

### 1. Verify Deployment
```bash
# Check main domain
curl -I https://app.yourdomain.com

# Check health endpoint (if implemented)
curl https://app.yourdomain.com/api/health

# Check API connectivity
curl https://app.yourdomain.com/api/auth/session
```

### 2. Test Core Functionality
- [ ] Homepage loads correctly
- [ ] Authentication flow works  
- [ ] API calls to backend succeed
- [ ] Dashboard renders without errors
- [ ] Navigation works properly
- [ ] Forms submit successfully

### 3. Performance Monitoring
```bash
# Vercel Dashboard > Analytics
# Monitor Core Web Vitals:
# - Largest Contentful Paint (LCP) < 2.5s
# - First Input Delay (FID) < 100ms  
# - Cumulative Layout Shift (CLS) < 0.1
```

## Environment Variables Validation

### Required Variables Check
```bash
# Verify all environment variables are set
# Vercel Dashboard > Project > Settings > Environment Variables

# Critical variables:
✅ NEXT_PUBLIC_SITE_URL
✅ NEXT_PUBLIC_API_URL  
✅ NEXTAUTH_URL
✅ NEXTAUTH_SECRET
✅ NODE_ENV=production
✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Runtime Validation
The app includes environment validation that will show clear error messages if variables are missing or invalid.

## Security Configuration

### 1. Headers Verification
```bash
# Security headers (configured in next.config.ts)
curl -I https://app.yourdomain.com

# Should include:
# Strict-Transport-Security: max-age=63072000
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN  
# Referrer-Policy: origin-when-cross-origin
```

### 2. HTTPS Enforcement
```bash
# Automatic via Vercel
# HTTP requests automatically redirect to HTTPS
```

### 3. Content Security Policy (Optional)
```bash
# Can be added to next.config.ts headers if needed
# Recommended for high-security applications
```

## Monitoring & Analytics

### 1. Vercel Analytics
```bash
# Built-in analytics available in dashboard
# Real User Monitoring (RUM)
# Core Web Vitals tracking
# Page load performance metrics
```

### 2. External Monitoring
```bash
# Sentry (if SENTRY_DSN configured)
# - Error tracking
# - Performance monitoring
# - Release tracking

# Optional: Google Analytics, Mixpanel, etc.
```

### 3. Uptime Monitoring
```bash
# Recommended external services:
# - UptimeRobot (free tier available)
# - Pingdom
# - StatusCake

# Monitor:
# - https://app.yourdomain.com (main app)  
# - https://app.yourdomain.com/health (if implemented)
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel Dashboard
# Common causes:
# - Missing environment variables
# - TypeScript errors (if not ignored)
# - Dependency issues
# - Memory limits exceeded
```

#### Runtime Errors
```bash
# Check Function Logs in Vercel Dashboard
# Common causes:
# - API connectivity issues
# - Environment variable problems
# - Database connection failures
```

#### Performance Issues
```bash
# Check Analytics dashboard
# Common optimizations:
# - Enable Vercel Edge Cache
# - Optimize images with next/image
# - Implement proper loading states
# - Use Vercel Edge Functions for API routes
```

### Debug Commands
```bash
# Local debugging
npm run build  # Test build locally
npm run start  # Test production build locally

# Vercel debugging  
vercel logs <deployment-url>  # View function logs
vercel inspect <deployment-url>  # Detailed deployment info
```

## Rollback Procedures

### Automatic Rollback
```bash
# Vercel Dashboard > Deployments
# Click "Promote to Production" on previous successful deployment
# Takes effect immediately
```

### CLI Rollback
```bash
# List deployments
vercel list

# Promote specific deployment
vercel promote <deployment-url> --scope=<team>
```

### Git-based Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel will automatically deploy the reverted version
```

## Performance Benchmarks

### Expected Performance
- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Optimization Tips
- Use `next/image` for all images
- Implement proper loading states
- Use React.memo for expensive components
- Optimize bundle size with dynamic imports
- Enable Vercel Edge Cache where appropriate

## Cost Optimization

### Vercel Pricing Tiers
- **Hobby**: Free (suitable for personal projects)
- **Pro**: $20/month per user (recommended for production)
- **Enterprise**: Custom pricing (high-scale applications)

### Usage Monitoring
- **Bandwidth**: Monitor via dashboard
- **Function Executions**: Track API route usage
- **Build Minutes**: Optimize build times

---

**Next Steps**: After web deployment, proceed to Phase F (Stripe & Email Validation) to test all integrations.



