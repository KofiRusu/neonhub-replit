# GitHub Configuration

This directory contains GitHub-specific configuration files for NeonHub v2.5.0.

## Workflows

### CI/CD Pipeline (`workflows/ci.yml`)

Automated continuous integration and deployment pipeline that:

- **On Pull Request:**
  - Runs linting for backend and frontend
  - Performs type checking
  - Builds both applications
  - Runs tests
  - Deploys preview to Vercel

- **On Push to Main:**
  - Runs all checks
  - Builds Docker images
  - Deploys to Vercel production
  - Creates GitHub releases

## Required Secrets

Configure these in: **Settings → Secrets and variables → Actions**

### Vercel Deployment
```
VERCEL_TOKEN          # Get from vercel.com/account/tokens
VERCEL_ORG_ID         # Found in .vercel/project.json after first deploy
VERCEL_PROJECT_ID     # Found in .vercel/project.json after first deploy
```

### Database (for tests)
```
DATABASE_URL          # PostgreSQL connection string for CI tests
```

## Branch Protection

Recommended settings for `main` branch:

- ✅ Require pull request before merging
- ✅ Require status checks to pass
  - backend-test
  - frontend-test
- ✅ Require branches to be up to date
- ✅ Require linear history
- ✅ Include administrators

## Status Badges

Add to your README:

```markdown
![CI](https://github.com/your-org/neonhub/actions/workflows/ci.yml/badge.svg)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://your-app.vercel.app)
```

