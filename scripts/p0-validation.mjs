#!/usr/bin/env node
/**
 * P0 Hardening Validation Script
 * Lightweight validation without Jest overhead
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertFileExists(path, message) {
  assert(existsSync(path), message || `File not found: ${path}`);
}

function assertContains(haystack, needle, message) {
  assert(
    haystack.includes(needle),
    message || `Expected to contain: ${needle}`
  );
}

console.log('🧪 P0 Hardening Validation\n');

console.log('📁 Mock Connectors');
test('MockConnector.ts exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/connectors/mock/MockConnector.ts'));
});

test('Mock connector index exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/connectors/mock/index.ts'));
});

test('All 17 mock connectors implemented', () => {
  const path = join(ROOT, 'apps/api/src/connectors/mock/MockConnector.ts');
  const content = readFileSync(path, 'utf-8');
  
  const required = [
    'MockEmailConnector',
    'MockSMSConnector',
    'MockSlackConnector',
    'MockStripeConnector',
    'MockWhatsAppConnector',
    'MockInstagramConnector',
    'MockFacebookConnector',
    'MockLinkedInConnector',
    'MockXConnector',
    'MockGoogleAdsConnector',
    'MockGA4Connector',
    'MockGSCConnector',
    'MockShopifyConnector',
    'MockDiscordConnector',
    'MockRedditConnector',
    'MockTikTokConnector',
    'MockYouTubeConnector',
  ];

  required.forEach((name) => assertContains(content, `class ${name}`, `Missing: ${name}`));
});

test('USE_MOCK_CONNECTORS flag in env.ts', () => {
  const path = join(ROOT, 'apps/api/src/config/env.ts');
  const content = readFileSync(path, 'utf-8');
  assertContains(content, 'USE_MOCK_CONNECTORS');
});

console.log('\n🧪 Test Infrastructure');
test('Test setup file exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/__tests__/setup.ts'));
});

test('Prisma mock exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/__mocks__/prisma.ts'));
  const content = readFileSync(join(ROOT, 'apps/api/src/__mocks__/prisma.ts'), 'utf-8');
  assertContains(content, 'mockPrismaClient');
});

test('Jest P0 config exists', () => {
  assertFileExists(join(ROOT, 'apps/api/jest.config.p0.js'));
});

console.log('\n📊 Metrics & Observability');
test('Metrics library exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/lib/metrics.ts'));
  const content = readFileSync(join(ROOT, 'apps/api/src/lib/metrics.ts'), 'utf-8');
  assertContains(content, 'agentRunsTotal');
  assertContains(content, 'agentRunDuration');
  assertContains(content, 'circuitBreakerFailures');
  assertContains(content, 'recordHttpRequest'); // Function name instead of variable
});

test('/metrics endpoint in server.ts', () => {
  const path = join(ROOT, 'apps/api/src/server.ts');
  const content = readFileSync(path, 'utf-8');
  assertContains(content, 'app.get("/metrics"');
  assertContains(content, 'getMetrics');
});

console.log('\n🤖 AgentRun Persistence');
test('executeAgentRun helper exists', () => {
  assertFileExists(join(ROOT, 'apps/api/src/agents/utils/agent-run.ts'));
  const content = readFileSync(join(ROOT, 'apps/api/src/agents/utils/agent-run.ts'), 'utf-8');
  assertContains(content, 'export async function executeAgentRun');
});

test('Orchestrator uses executeAgentRun', () => {
  const path = join(ROOT, 'apps/api/src/services/orchestration/router.ts');
  const content = readFileSync(path, 'utf-8');
  assertContains(content, 'import { executeAgentRun }');
  assertContains(content, 'await executeAgentRun(');
});

console.log('\n🚀 CI/CD');
test('P0 hardening workflow exists', () => {
  assertFileExists(join(ROOT, '.github/workflows/ci-p0-hardening.yml'));
  const content = readFileSync(join(ROOT, '.github/workflows/ci-p0-hardening.yml'), 'utf-8');
  assertContains(content, 'USE_MOCK_CONNECTORS');
  assertContains(content, '/metrics');
});

console.log('\n🌐 UI→API Integration');
test('Content page uses tRPC', () => {
  const path = join(ROOT, 'apps/web/src/app/content/new/page.tsx');
  const content = readFileSync(path, 'utf-8');
  assertContains(content, 'import { trpc }');
  assertContains(content, 'trpc.content.generateArticle.useMutation');
});

console.log('\n📚 Documentation');
const docs = [
  'docs/P0_HARDENING_SUMMARY.md',
  'docs/OBSERVABILITY_GUIDE.md',
  'reports/WEEK1_COMPLETION_AUDIT.md',
];

docs.forEach((doc) => {
  test(`${doc} exists`, () => {
    assertFileExists(join(ROOT, doc));
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  console.log('\n❌ P0 validation failed');
  process.exit(1);
} else {
  console.log('\n✅ P0 validation successful - all deliverables present');
  process.exit(0);
}

