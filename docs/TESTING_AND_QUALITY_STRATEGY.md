# NeonHub Testing & Quality Strategy

**Version:** 3.0+  
**Last Updated:** November 17, 2025  
**Target Coverage:** 85%+ (Currently 26%)

---

## Overview

NeonHub employs a comprehensive testing strategy encompassing unit tests, integration tests, end-to-end tests, and manual QA. The goal is to achieve 85%+ code coverage while maintaining fast test execution and reliable CI/CD pipelines.

### Testing Pyramid

```
          ┌─────────────┐
          │     E2E     │  Manual + Automated (10%)
          │   Tests     │  
          ├─────────────┤
          │ Integration │  API + DB + External Services (20%)
          │   Tests     │
          ├─────────────┤
          │    Unit     │  Business Logic + Utils (70%)
          │   Tests     │
          └─────────────┘
```

### Current Status

- **Unit Tests:** 26% coverage (Target: 70%+)
- **Integration Tests:** Partial (Target: 20%+)
- **E2E Tests:** Basic (Target: 10%+)
- **Manual QA:** Ongoing

---

## Testing Stack

| Layer | Framework | Purpose |
|-------|-----------|---------|
| **Unit** | Jest | Test individual functions, services |
| **Integration** | Jest + Supertest | Test API endpoints, database |
| **E2E** | Playwright | Test full user flows in browser |
| **API** | Postman/Insomnia | Manual API testing |
| **Load** | k6 (planned) | Performance and load testing |

---

## Unit Testing

### Philosophy

- Test business logic in isolation
- Mock external dependencies (database, APIs)
- Fast execution (<5ms per test)
- High coverage (>80% target)

### Structure

```
apps/api/src/
├── services/
│   ├── content.service.ts
│   └── __tests__/
│       └── content.service.test.ts
├── agents/
│   ├── campaign.agent.ts
│   └── __tests__/
│       └── campaign.agent.test.ts
```

### Example Test

```typescript
// services/__tests__/content.service.test.ts
import { ContentService } from '../content.service';
import { mockPrisma, mockLLM } from '@/test/mocks';

describe('ContentService', () => {
  let service: ContentService;
  
  beforeEach(() => {
    service = new ContentService(mockPrisma, mockLLM);
  });
  
  it('should generate content with brand voice', async () => {
    mockLLM.generate.mockResolvedValue({ text: 'Generated content' });
    
    const result = await service.generateContent({
      prompt: 'Write about AI',
      workspaceId: 'ws_123'
    });
    
    expect(result.body).toContain('Generated content');
    expect(mockLLM.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' })
        ])
      })
    );
  });
});
```

### Running Unit Tests

```bash
# All tests
pnpm --filter apps/api test

# Watch mode
pnpm --filter apps/api test:watch

# Coverage
pnpm --filter apps/api test:coverage

# Specific file
pnpm --filter apps/api test content.service.test.ts
```

---

## Integration Testing

### Philosophy

- Test API endpoints with real database
- Use test database (separate from dev)
- Test authentication and authorization
- Test external service integration (mocked)

### Structure

```
apps/api/src/
├── __tests__/
│   ├── integration/
│   │   ├── agents.test.ts
│   │   ├── content.test.ts
│   │   └── campaigns.test.ts
│   └── setup.ts  # Test database setup
```

### Example Test

```typescript
// __tests__/integration/agents.test.ts
import request from 'supertest';
import { app } from '@/server';
import { prisma } from '@/db';

describe('Agents API', () => {
  let authToken: string;
  let workspaceId: string;
  
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`TRUNCATE TABLE "Agent" CASCADE`;
    
    // Create test user and workspace
    const user = await prisma.user.create({ data: { email: 'test@example.com' } });
    const workspace = await prisma.workspace.create({ data: { name: 'Test', ownerId: user.id } });
    workspaceId = workspace.id;
    
    // Get auth token
    authToken = generateTestToken(user.id);
  });
  
  it('POST /api/agents - should create agent', async () => {
    const response = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        workspaceId,
        name: 'Test Agent',
        kind: 'COPILOT',
        prompt: 'You are a helpful assistant'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Agent');
  });
});
```

---

## End-to-End Testing (Playwright)

### Philosophy

- Test critical user flows
- Run in real browser
- Test across browsers (Chrome, Firefox, Safari)
- Test responsive design

### Structure

```
apps/web/tests/e2e/
├── auth.spec.ts          # Login, register, logout
├── dashboard.spec.ts      # Dashboard interactions
├── agents.spec.ts        # Agent creation and execution
├── campaigns.spec.ts     # Campaign workflows
└── content.spec.ts       # Content generation
```

### Example Test

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});

test('user can create agent', async ({ page }) => {
  // Login first
  await loginAsTestUser(page);
  
  await page.goto('http://localhost:3000/agents/new');
  await page.fill('input[name="name"]', 'My Agent');
  await page.selectOption('select[name="kind"]', 'COPILOT');
  await page.fill('textarea[name="prompt"]', 'You are helpful');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/\/agents\/ag_/);
  await expect(page.locator('h1')).toContainText('My Agent');
});
```

### Running E2E Tests

```bash
cd apps/web

# Install browsers
pnpm playwright install

# Run tests (headless)
pnpm playwright test

# Run with UI
pnpm playwright test --ui

# Run specific test
pnpm playwright test auth.spec.ts

# Debug mode
pnpm playwright test --debug
```

---

## Test Data & Fixtures

### Factory Pattern

```typescript
// test/factories/user.factory.ts
export function createTestUser(overrides = {}) {
  return {
    id: `user_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides
  };
}

export function createTestWorkspace(overrides = {}) {
  return {
    id: `ws_${Date.now()}`,
    name: 'Test Workspace',
    slug: `test-${Date.now()}`,
    ...overrides
  };
}
```

### Seed Data for Tests

```typescript
// test/fixtures/seed.ts
export async function seedTestDatabase() {
  const user = await prisma.user.create({
    data: createTestUser()
  });
  
  const workspace = await prisma.workspace.create({
    data: createTestWorkspace({ ownerId: user.id })
  });
  
  return { user, workspace };
}
```

---

## Mocking Strategy

### External APIs

```typescript
// test/mocks/openai.mock.ts
export const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Mocked response' } }]
      })
    }
  }
};
```

### Database (Prisma)

```typescript
// test/mocks/prisma.mock.ts
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  agent: {
    findMany: jest.fn(),
    create: jest.fn()
  }
  // ... more models
};
```

---

## Test Coverage

### Current Coverage (26%)

| Module | Coverage | Target |
|--------|----------|--------|
| **Services** | 35% | 80% |
| **Agents** | 20% | 70% |
| **Routes** | 15% | 70% |
| **Utils** | 45% | 90% |
| **Total** | 26% | 85% |

### Roadmap to 85%

**Week 1: Services (30 → 60%)**
- `content.service.ts`
- `campaign.service.ts`
- `seo.service.ts`
- `brand-voice.service.ts`
- `analytics.service.ts`

**Week 2: Agents (20 → 60%)**
- All seven agents
- Orchestrator logic
- Tool execution

**Week 3: Routes (15 → 60%)**
- tRPC routers
- REST endpoints
- WebSocket handlers

**Week 4: Integration (0 → 20%)**
- Full workflow tests
- Database integration
- External service mocks

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm prisma migrate deploy
      - run: pnpm test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm playwright install
      - run: pnpm test:e2e
```

---

## Quality Gates

### Pre-Commit
- Linting (`eslint`)
- Type checking (`tsc`)
- Prettier formatting

### Pre-Push
- Unit tests pass
- No type errors

### Pre-Merge (CI)
- All tests pass (unit + integration + e2e)
- Coverage threshold met (85%+)
- Build succeeds
- No security vulnerabilities

---

## Performance Testing

### Load Testing (k6 - Planned)

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 }     // Ramp down
  ]
};

export default function () {
  let response = http.get('https://api.neonhubecosystem.com/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
}
```

---

## Manual QA

### Test Checklists

**See:**
- [`docs/LOCAL_UI_UX_TEST_CHECKLIST.md`](./LOCAL_UI_UX_TEST_CHECKLIST.md) - UI testing checklist
- [`scripts/smoke-ui.md`](../scripts/smoke-ui.md) - Smoke test checklist

### Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

### Accessibility Testing

- Keyboard navigation
- Screen reader compatibility (NVDA, JAWS)
- Color contrast (WCAG 2.1 AA)
- ARIA labels

---

## Known Issues

### Current Test Issues

1. **Jest Heap Limit** - Some test suites OOM
   - **Workaround:** Run with `--max-old-space-size=4096`
   
2. **TypeScript Config** - Module resolution issues
   - **Fix:** Update `jest.config.js` with proper `moduleNameMapper`
   
3. **Mock Connectors** - Not all connectors have mocks
   - **Fix:** Add `USE_MOCK_CONNECTORS=true` support

---

## Related Documentation

- [`docs/COMPLETE_TESTING_VALIDATION_ROADMAP.md`](./COMPLETE_TESTING_VALIDATION_ROADMAP.md) - Comprehensive test strategy
- [`docs/BROWSER_TESTING_GUIDE.md`](./BROWSER_TESTING_GUIDE.md) - Browser testing guide
- [`docs/JEST_COVERAGE_SETUP.md`](./JEST_COVERAGE_SETUP.md) - Coverage configuration
- [`docs/P0_TEST_STRATEGY.md`](./P0_TEST_STRATEGY.md) - Priority 0 testing

---

**Document Version:** 1.0  
**Last Updated:** November 17, 2025  
**Maintained By:** NeonHub QA Team  
**Next Review:** December 1, 2025

