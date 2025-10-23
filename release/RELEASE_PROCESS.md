# NeonHub Release Process

## Overview
This document outlines the standardized release process for NeonHub, ensuring consistency, quality, and traceability across all deployments.

## Release Versioning
- **Format**: `v{MAJOR}.{MINOR}.{PATCH}-{CHANNEL}` (e.g., `v3.2.0-stable`)
- **Channels**: `alpha`, `beta`, `rc` (release candidate), `stable`
- **Semver**: Follows [Semantic Versioning 2.0.0](https://semver.org/)

## Pre-Release Checklist

### 1. Code Quality
- [ ] All tests passing (>= 95% coverage)
- [ ] ESLint/TypeScript validation: 0 errors, 0 warnings
- [ ] Code review approved by 2+ maintainers
- [ ] No security vulnerabilities (npm audit clean)

### 2. Documentation
- [ ] CHANGELOG updated with release notes
- [ ] README updated with new features/breaking changes
- [ ] API documentation synchronized
- [ ] Migration guides created (if applicable)

### 3. Environment
- [ ] DATABASE_URL configured
- [ ] OPENAI_API_KEY valid
- [ ] STRIPE_SECRET_KEY valid
- [ ] All CI/CD checks passing

### 4. Build & Artifacts
- [ ] Local build successful (`pnpm build`)
- [ ] Docker images built and tested
- [ ] Release artifacts generated and signed
- [ ] Package versions updated

## Release Steps

### Step 1: Create Release Branch
```bash
git checkout -b release/v{VERSION}
```

### Step 2: Update Version Numbers
```bash
# Update package.json versions
pnpm version {VERSION}

# Update release notes
cp docs/RELEASE_NOTES_TEMPLATE.md release/RELEASE_NOTES_v{VERSION}.md
```

### Step 3: Run Full Test Suite
```bash
# Prerequisites check
export PATH="/Users/kofirusu/.npm-global/bin:$PATH"
source .env

# Install and test
pnpm install
pnpm lint
pnpm type-check
pnpm test
```

### Step 4: Create Release Commit
```bash
git add -A
git commit -m "chore(release): v{VERSION}

- Update version numbers
- Generate release notes
- Update changelog
- Lock dependencies"

git push origin release/v{VERSION}
```

### Step 5: Create Pull Request
- Open PR from `release/v{VERSION}` → `main`
- Run automated checks
- Await approval from 2+ reviewers

### Step 6: Tag Release
```bash
git tag -a v{VERSION} -m "Release v{VERSION}"
git push origin v{VERSION}
```

GitHub Actions will automatically:
1. Validate the release
2. Build artifacts
3. Create GitHub Release
4. Deploy to production

### Step 7: Post-Release Verification
- [ ] GitHub Release created with notes
- [ ] Build artifacts available
- [ ] API deployed and healthy
- [ ] Web app deployed and accessible
- [ ] Monitoring alerts configured
- [ ] Performance baselines recorded

## Deployment Targets

### API (Node.js + Prisma)
- **Primary**: Railway/Render
- **Fallback**: Docker on EC2
- **Database**: PostgreSQL (RDS)

### Web (Next.js)
- **Primary**: Vercel
- **Fallback**: AWS S3 + CloudFront
- **CDN**: Vercel Edge Network

### Core Modules
- **Published to**: npm (`@neonhub/*`)
- **Registry**: https://registry.npmjs.org/
- **Auth**: `.npmrc` token required

## Rollback Procedure

If deployment fails:
```bash
# Revert tag
git tag -d v{VERSION}
git push origin :refs/tags/v{VERSION}

# Rollback deployment
# API: Revert to previous deployment
# Web: Revert Vercel deployment
# Notify team in #releases Slack channel
```

## Post-Release

1. **Update Documentation**
   - [ ] Update production version in README
   - [ ] Archive release notes
   - [ ] Update API docs

2. **Monitor**
   - [ ] Check error logs for 24 hours
   - [ ] Monitor performance metrics
   - [ ] Track user feedback

3. **Communication**
   - [ ] Post release announcement
   - [ ] Update version in product settings
   - [ ] Notify integration partners

## Emergency Release

For critical security/bug fixes:
```bash
# Create hotfix branch from main
git checkout -b hotfix/v{VERSION}
git tag -a v{VERSION} -m "Hotfix: {REASON}"
git push origin v{VERSION}
```

Follow same validation and deployment process.

## Release Notes Template

```markdown
# Release Notes: v{VERSION}

## New Features
- Feature 1
- Feature 2

## Bug Fixes
- Fixed issue X
- Fixed issue Y

## Breaking Changes
- Change 1 (migration required)

## Migration Guide
[Include any data migration steps]

## Deployment Time
Estimated: 10-15 minutes

## Support
- Issues: https://github.com/NeonHub/issues
- Docs: https://docs.neonhub.dev
```

## Contact

- **Release Manager**: @kofirusu
- **Slack Channel**: #releases
- **On-Call**: Check PagerDuty
