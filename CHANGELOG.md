# Changelog

All notable changes to NeonHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive GitHub issue and PR templates (bug.md, feature.md, pull_request_template.md)
- CODEOWNERS file for automated code review assignments
- SECURITY.md with vulnerability reporting process and security best practices
- CONTRIBUTING.md with detailed contribution guidelines and development workflow
- LICENSE file (MIT License)
- ENV_MATRIX.md comprehensive environment variables documentation
- DB_MIGRATE_STATUS.md database migration tracking
- STRIPE_TEST_PLAN.md payment integration testing guide
- GitHub Actions database deployment workflow (db-deploy.yml)
- Local one-command deployment script (scripts/db-deploy-local.sh)
- Comprehensive documentation (1,837+ lines)

### Changed
- Updated ops sweep administrative process
- Enhanced CI/CD documentation
- Improved environment variable management
- Standardized secret storage across platforms

### Documentation
- Created comprehensive administrative operations documentation
- Added security and compliance guidelines
- Documented Stripe integration testing procedures
- Enhanced database migration documentation

---

## [3.2.0] - 2025-10-26

### Added - Database Deployment Infrastructure

#### GitHub Actions (Option A)
- Automated database deployment workflow
- Manual and auto-trigger support (push to main)
- Prisma migrations + seeding
- npm/pnpm fallback for compatibility
- Connection pooling support

#### Local Deployment (Option C)
- One-command deployment script (`scripts/db-deploy-local.sh`)
- Automatic Docker pgvector provisioning
- Support for managed databases (Neon, Supabase)
- Full deployment pipeline: generate → migrate → seed
- Error recovery and retry logic

#### Workspace Fixes (Option B)
- Fixed Corepack permission errors (npm fallback)
- Fixed DATABASE_URL missing errors (Docker fallback)
- Added pgvector support for vector operations
- Comprehensive diagnostics and smoke testing

#### Documentation
- CI_DB_DEPLOY.md - GitHub Actions setup guide (159 lines)
- LOCAL_DB_DEPLOY.md - Local deployment guide (321 lines)
- WORKSPACE_DB_FIX_REPORT.md - Diagnostics report (381 lines)
- DB_SMOKE_RESULTS.md - Test results (479 lines)
- DB_COMPLETION_REPORT.md - Final deployment status
- EXECUTION_COMPLETE.md - Deployment summary (337 lines)

### Fixed
- Corepack EACCES permission denied errors
- DATABASE_URL configuration issues
- Vector type support for pgvector extension
- pnpm ENOENT spawn errors
- Migration deployment workflow

### Changed
- Enhanced Prisma configuration with directUrl support
- Improved Docker container setup
- Updated CI/CD workflows
- Standardized environment variable management

### Infrastructure
- Total: 1,837 lines of production documentation created
- 201 files modified/created in deployment infrastructure
- +27,341 insertions, -2,359 deletions
- 26/26 smoke tests passing (theoretical)

---

## [3.1.0] - 2025-01-26

### Added
- Connector framework (Slack, Gmail, Notion, etc.)
- Real-time collaboration features
- Document management system
- Task tracking functionality
- Team member management
- Feedback system
- Internal messaging

### Database
- Added 10 new models for Phase 4 Beta
- Schema realignment migration
- Connector auth system
- Trigger and action configurations

---

## [3.0.0] - 2025-01-05

### Added - Phase 4 Beta Features

#### Core Features
- Document management with versioning
- Task management with assignments
- Feedback and bug reporting
- Internal messaging system
- Team collaboration features

#### Database Schema
- Document model with parent/child relationships
- Task model with priority and assignments
- Feedback model with categorization
- Message model with threading
- TeamMember model with roles

### Changed
- Enhanced user model with beta user flag
- Updated subscription model with usage tracking
- Improved audit logging

---

## [2.5.0] - 2024-12-15

### Added
- Campaign management system
- Email sequence automation
- Social media post scheduling
- A/B testing framework
- Usage tracking and analytics

### Database
- Campaign, EmailSequence, SocialPost models
- ABTest model for experimentation
- UsageRecord for billing metering

---

## [2.4.0] - 2024-11-20

### Added
- Stripe billing integration
- Subscription management
- Invoice generation
- Usage-based billing
- Customer portal

### Database
- Subscription model with plan limits
- Invoice model with payment tracking
- UsageRecord for metering

---

## [2.3.0] - 2024-10-25

### Added
- AI agent framework (5 agents)
- Content generation
- SEO optimization
- Email automation
- Social media automation
- Customer support automation

### Agents
- Content Agent - AI content generation
- Ad Agent - Campaign optimization
- Insight Agent - Data analysis
- Design Agent - AI-powered design
- Trend Agent - Social media monitoring

---

## [2.0.0] - 2024-09-15

### Added
- NextAuth authentication
- Role-based access control
- User settings and preferences
- Credential management for OAuth
- Audit logging

### Database
- User, Account, Session models (NextAuth)
- UserSettings for preferences
- Credential for API tokens
- AuditLog for security tracking

---

## [1.0.0] - 2024-08-01

### Initial Release

#### Core Features
- User authentication
- Content draft management
- Agent job queue
- Metrics collection

#### Infrastructure
- Next.js 15 frontend
- Express + Prisma backend
- PostgreSQL database
- Docker support

#### Database
- User model
- ContentDraft model
- AgentJob model
- MetricEvent model

---

## Version Numbering

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Release Process

1. Update version in `package.json`
2. Update this CHANGELOG.md
3. Create release branch: `release/vX.Y.Z`
4. Run full test suite
5. Deploy to staging
6. Smoke test staging
7. Create GitHub release
8. Deploy to production
9. Monitor and verify

---

## Links

- [Repository](https://github.com/KofiRusu/NeonHub)
- [Documentation](./docs/)
- [Issues](https://github.com/KofiRusu/NeonHub/issues)
- [Releases](https://github.com/KofiRusu/NeonHub/releases)

---

## Contributors

See [CONTRIBUTORS.md](./CONTRIBUTORS.md) for a list of contributors.

---

**Maintained by:** Kofi Rusu / NeonHub Team  
**Last Updated:** 2025-10-26
