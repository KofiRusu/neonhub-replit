# Contributing to NeonHub

Thank you for your interest in contributing to NeonHub! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Style](#commit-style)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Code Style](#code-style)
- [Documentation](#documentation)

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or pnpm 9.x
- Docker (for local database)
- Git

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/[your-username]/NeonHub.git
   cd NeonHub
   ```

2. **Install Dependencies**
   ```bash
   pnpm install --frozen-lockfile
   # or
   npm ci
   ```

3. **Setup Environment**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. **Start Local Database**
   ```bash
   docker run -d \
     --name neonhub-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5433:5432 \
     ankane/pgvector
   ```

5. **Run Migrations**
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/neonhub"
   pnpm --filter apps/api run prisma:migrate:dev
   ```

6. **Start Development Server**
   ```bash
   pnpm dev
   ```

## Development Workflow

### Verify Scripts

Before making changes, ensure everything works:

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Build
pnpm build

# Test
pnpm test
```

### Making Changes

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run verify scripts
5. Commit using conventional commits
6. Push and create a pull request

## Branching Strategy

### Branch Naming Convention

```
<type>/<short-description>

Examples:
- feature/user-authentication
- bugfix/payment-validation
- chore/update-dependencies
- docs/api-documentation
```

### Branch Types
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation only
- `refactor/` - Code refactoring
- `test/` - Test additions/fixes
- `ci/` - CI/CD changes

### Branch Protection

- `main` - Protected, requires PR reviews
- `staging` - Protected, requires CI passing
- `develop` - Integration branch (if used)

## Commit Style

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvement
- `test` - Adding/updating tests
- `chore` - Maintenance (dependencies, build, etc.)
- `ci` - CI/CD changes
- `revert` - Reverting a previous commit

### Scopes
- `api` - Backend API
- `web` - Frontend web app
- `db` - Database/Prisma
- `auth` - Authentication
- `billing` - Stripe/billing
- `agents` - AI agents
- `ci` - CI/CD
- `deps` - Dependencies

### Examples

```bash
# Feature
git commit -m "feat(api): add user profile endpoint"

# Bug fix
git commit -m "fix(web): resolve navigation menu overflow"

# Breaking change
git commit -m "feat(api)!: migrate to Prisma 6

BREAKING CHANGE: requires DATABASE_URL with directUrl"

# With body
git commit -m "refactor(agents): optimize content generation

- Reduce API calls by 30%
- Implement caching layer
- Add retry logic

Closes #123"
```

### Commit Guidelines
- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line max 72 characters
- Reference issues/PRs in body
- Explain "what" and "why", not "how"

## Pull Request Process

### Before Creating PR

✅ **Checklist:**
- [ ] Code follows project style guide
- [ ] All tests pass locally
- [ ] Linting passes (`pnpm lint`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated
- [ ] Self-review completed
- [ ] Commits are clean and descriptive

### Creating PR

1. **Use PR Template**
   - Fill out all sections
   - Mark test matrix items
   - Add screenshots for UI changes

2. **Title Format**
   ```
   <type>(<scope>): <description>
   
   Example:
   feat(api): add user profile endpoints
   ```

3. **Description**
   - Explain what and why
   - Link related issues
   - List breaking changes
   - Note deployment considerations

4. **Labels**
   - Apply appropriate labels (bug, feature, etc.)
   - Set milestone if applicable
   - Assign yourself

5. **Reviewers**
   - Request review from CODEOWNERS
   - Tag subject matter experts

### PR Review Process

1. **Automated Checks**
   - CI must pass (lint, type-check, build, test)
   - No merge conflicts
   - Branch up to date with base

2. **Code Review**
   - At least 1 approval required
   - Address all review comments
   - Re-request review after changes

3. **Merge**
   - Use "Squash and merge" for feature branches
   - Use "Rebase and merge" for hotfixes
   - Delete branch after merge

## Testing Guidelines

### Test Coverage Requirements
- **API:** 90% coverage minimum
- **Web:** 80% coverage minimum
- **Core Packages:** 95% coverage minimum

### Writing Tests

**Unit Tests:**
```typescript
// apps/api/src/__tests__/services/user.test.ts
import { UserService } from '../services/user';

describe('UserService', () => {
  it('should create a user', async () => {
    const user = await UserService.create({
      email: 'test@example.com',
      name: 'Test User',
    });
    
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });
});
```

**Integration Tests:**
```typescript
// apps/api/src/__tests__/routes/users.test.ts
import request from 'supertest';
import { app } from '../server';

describe('POST /api/users', () => {
  it('should create a user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com', name: 'Test' });
      
    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('test@example.com');
  });
});
```

**E2E Tests:**
```typescript
// apps/web/tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test:coverage

# E2E
pnpm test:e2e

# Specific file
pnpm test user.test.ts
```

## Code Style

### TypeScript/JavaScript

```typescript
// ✅ Good
export async function getUserById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return user;
}

// ❌ Bad
export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
```

### React/Next.js

```typescript
// ✅ Good
export function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useUser(userId);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!data) return null;
  
  return (
    <div className="user-profile">
      <h1>{data.name}</h1>
      <p>{data.email}</p>
    </div>
  );
}

// ❌ Bad
export function UserProfile({ userId }: any) {
  const user = useUser(userId);
  return <div>{user?.name}</div>;
}
```

### Style Guide
- Use TypeScript strict mode
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Use async/await over promises
- Use destructuring
- Use optional chaining (`?.`)
- Use nullish coalescing (`??`)
- Avoid `any` type
- Export named exports (avoid default exports)
- Use Prettier for formatting
- Use ESLint rules

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `kebab-case.ts`
- Tests: `*.test.ts` or `*.spec.ts`
- Hooks: `use*.ts`
- Services: `*.service.ts`

## Documentation

### Code Comments
- Explain "why", not "what"
- Document complex logic
- Add JSDoc for public APIs

```typescript
/**
 * Creates a new campaign with the given configuration.
 * 
 * @param userId - The ID of the user creating the campaign
 * @param config - Campaign configuration
 * @returns The created campaign with scheduled jobs
 * @throws ValidationError if config is invalid
 * @throws QuotaExceededError if user has reached campaign limit
 */
export async function createCampaign(
  userId: string,
  config: CampaignConfig
): Promise<Campaign> {
  // Implementation
}
```

### Documentation Files
- Update README.md for user-facing changes
- Update API docs for endpoint changes
- Add migration guides for breaking changes
- Keep CHANGELOG.md updated

## Database Changes

### Prisma Migrations

```bash
# Create migration
pnpm --filter apps/api run prisma:migrate:dev --name add_user_role

# Apply migrations
pnpm --filter apps/api run prisma:migrate:deploy

# Reset database (dev only)
pnpm --filter apps/api run prisma:migrate:reset
```

### Migration Guidelines
- Test migrations locally first
- Include both up and down migrations
- Keep migrations small and focused
- Document breaking schema changes
- Backup production before running migrations

## Environment Variables

### Adding New Variables

1. Add to `.env.example` with description
2. Add to `docs/ENV_MATRIX.md`
3. Update validation in `apps/api/src/config/env.ts`
4. Document in PR description
5. Update CI/CD secrets

### Example

```bash
# .env.example
# Stripe API key for payment processing
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
```

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch: `release/v3.2.0`
4. Run full test suite
5. Create GitHub release with notes
6. Deploy to staging
7. Smoke test staging
8. Deploy to production
9. Monitor Sentry and logs

## Getting Help

- **Documentation:** Check `/docs` folder
- **Issues:** Search existing GitHub issues
- **Discussions:** Use GitHub Discussions
- **Slack:** Internal team channel
- **Email:** dev@neonhubecosystem.com

## Recognition

Contributors are recognized in:
- CONTRIBUTORS.md
- Release notes
- Project README

Thank you for contributing to NeonHub! 🚀

