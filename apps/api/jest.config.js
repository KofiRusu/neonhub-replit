const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src', '<rootDir>/../../tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
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
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};

export default config;
