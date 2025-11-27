const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src', '<rootDir>/../../tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: [
    'ContentAgent.spec.ts',
    'brand-voice-ingestion.spec.ts'
  ],
  testTimeout: 30000,
  maxWorkers: 4,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!**/node_modules/**'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
        diagnostics: false
      }
    ]
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid|superjson|copy-anything|is-what)/)'],
  passWithNoTests: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@neonhub/orchestrator-contract$': '<rootDir>/../../core/orchestrator-contract/index.cjs',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  collectCoverage: false,
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
};

export default config;
