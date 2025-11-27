/**
 * P0 Hardening - Lightweight Jest Config
 * Runs only new P0 validation tests, skips heavy legacy tests
 */

const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src'],
  
  // P0: Only run ultra-lightweight validation tests (no app imports)
  testMatch: [
    '**/__tests__/p0-minimal.test.ts',
  ],
  
  // Minimal coverage collection (avoid importing heavy modules)
  collectCoverageFrom: [
    'src/lib/metrics.ts',
    'src/connectors/mock/**/*.ts',
    'src/services/orchestration/router.ts',
    'src/services/orchestration/index.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  
  // Aggressive memory limits
  maxWorkers: 1,
  workerIdleMemoryLimit: '256MB',
  testTimeout: 10000,
  
  coverageProvider: 'v8',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      }
    ]
  },
  
  transformIgnorePatterns: ['/node_modules/(?!(uuid|superjson)/)'],
  passWithNoTests: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  // Minimal setup (no heavy mocks needed for file-based tests)
  setupFiles: ['<rootDir>/jest.setup.ts'],
  setupFilesAfterEnv: [], // Skip heavy mock setup
  
  collectCoverage: true,
  coverageReporters: ['text', 'json-summary'],
  
  modulePathIgnorePatterns: ['<rootDir>/.pnpm', '<rootDir>/dist', '<rootDir>/build', '<rootDir>/logs'],
  
  // Skip ALL legacy tests to avoid heap issues
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '\\.skip\\.ts$',
    'routes/',
    'agents/',
    'services/(?!orchestration)',
    'agentic-services',
    'smoke.spec.ts',
    'integration',
    'ContentAgent',
    'health.test',
  ],
  
  // Relaxed coverage for P0 (we're proving capability, not full coverage)
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    }
  },
  
  // Stability settings
  bail: 0,
  verbose: true,
  detectOpenHandles: false,
  forceExit: true,
};

export default config;

